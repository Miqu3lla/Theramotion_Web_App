import { create } from 'zustand'
import { supabase } from '../utils/db'


interface Patient {
    id: string,
    first_name?: string,
    last_name?: string,
    affected_area?: string,
    affected_side?: string
}

interface ExerciseScore {
    exercise_type: string,
    latest_form_score: number | null,
}

interface PatientState {
    isLoading: boolean,
    error: string | null,
    patients: Patient[] | null,
    patientPerformanceScores: Record<string, ExerciseScore[]>,
    fetchPatients: () => Promise<void>,
    fetchPatientPerformanceScores: (patientId: string) => Promise<void>,
}

const usePatientStore = create<PatientState>((set) => ({
    isLoading: false,
    error: null,
    patients: null,
    patientPerformanceScores: {},

    fetchPatients: async () => {
        set({ isLoading: true, error: null })

        try {
            const { data, error } = await supabase.from('patients').select('*')

            if (error) throw error
            if (!data) throw new Error('No patients found')

            set({ patients: data, isLoading: false })

        } catch (error: any) {
            console.error('Error fetching patients:', error)
            set({ isLoading: false, error: error.message })
        }
    },

    fetchPatientPerformanceScores: async (patientId: string) => {
        set({ isLoading: true, error: null })

        try {
            // Fetch all exercises for this patient from form_predictions
            const { data: predictions, error: predictionsError } = await supabase
                .from('form_predictions')
                .select('exercise_type')
                .eq('patient_id', patientId)

            if (predictionsError) throw predictionsError

            // For each exercise, fetch the latest_form_score from recommendation_logs
            const scores: ExerciseScore[] = await Promise.all(
                (predictions ?? []).map(async (prediction) => {
                    const { data: logs, error: logsError } = await supabase
                        .from('recommendation_logs')
                        .select('latest_form_score')
                        .eq('patient_id', patientId)
                        .eq('exercise_type', prediction.exercise_type)
                        .order('created_at', { ascending: false })
                        .limit(1)

                    if (logsError) throw logsError

                    return {
                        exercise_type: prediction.exercise_type,
                        latest_form_score: logs?.[0]?.latest_form_score ?? null,
                    }
                })
            )

            set((state) => ({
                patientPerformanceScores: {
                    ...state.patientPerformanceScores,
                    [patientId]: scores,
                },
                isLoading: false,
            }))

        } catch (error: any) {
            console.error('Error fetching patient performance scores:', error)
            set({ isLoading: false, error: error.message })
        }
    },

}))

export default usePatientStore