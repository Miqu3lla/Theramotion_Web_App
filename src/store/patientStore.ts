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
    isLoadingScores: boolean,
    error: string | null,
    patients: Patient[] | null,
    patientPerformanceScores: Record<string, ExerciseScore[]>,
    fetchPatients: () => Promise<void>,
    fetchPatientPerformanceScores: (patientId: string) => Promise<void>,
}

const usePatientStore = create<PatientState>((set) => ({
    isLoading: false,
    isLoadingScores: false,
    error: null,
    patients: null,
    // keyed by patient id so each patient's scores are cached separately
    patientPerformanceScores: {},

    // Fetches all patients from the patients table and stores them in state
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

    // Fetches all exercises for a patient and pairs each with the patient's latest overall score
    fetchPatientPerformanceScores: async (patientId: string) => {
        set({ isLoadingScores: true, error: null })

        try {
            // Step 1 — get exercises newest first so deduplication keeps the most recent of each type
            const { data: predictions, error: predictionsError } = await supabase
                .from('form_predictions')
                .select('exercise_type')
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false })

            if (predictionsError) throw predictionsError

            // Step 2 — deduplicate by exercise_type (first occurrence = most recent) then cap at 3
            const seen = new Set<string>()
            const recentExercises = (predictions ?? [])
                .filter(p => {
                    if (seen.has(p.exercise_type)) return false
                    seen.add(p.exercise_type)
                    return true
                })
                .slice(0, 3)

            // Step 3 — get the single most recent score for this patient
            // recommendation_logs has no exercise_type column, so one score applies to all exercises
            const { data: logs, error: logsError } = await supabase
                .from('recommendation_logs')
                .select('latest_form_score')
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false }) // newest entry first
                .limit(1)

            if (logsError) throw logsError

            const latestScore = logs?.[0]?.latest_form_score ?? null

            // Step 4 — pair the 3 unique recent exercises with the latest score
            const scores: ExerciseScore[] = recentExercises.map((exercise) => ({
                exercise_type: exercise.exercise_type,
                latest_form_score: latestScore,
            }))

            // Step 5 — merge into the cache without overwriting other patients' data
            set((state) => ({
                patientPerformanceScores: {
                    ...state.patientPerformanceScores,
                    [patientId]: scores,
                },
                isLoadingScores: false,
            }))

        } catch (error: any) {
            console.error('Error fetching patient performance scores:', error)
            set({ isLoadingScores: false, error: error.message })
        }
    },

}))

export default usePatientStore