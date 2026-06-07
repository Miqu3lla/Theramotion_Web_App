import { create } from 'zustand'
import { supabase } from '../utils/db'
import type { Patient } from '../hooks/usePatientSearch'


// Patient type is defined once in usePatientSearch and re-used here to avoid
// duplicate declarations that cause TypeScript structural-typing mismatches.

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
            // Select only the columns the UI consumes — avoids over-fetching PHI
            // that may exist in other columns (OWASP API3: Excessive Data Exposure).
            const { data, error } = await supabase
                .from('patients')
                .select('id, first_name, last_name, affected_area, affected_side')

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

            // Step 3 — for each exercise, fetch its own most recent score from recommendation_logs
            const scores: ExerciseScore[] = await Promise.all(
                recentExercises.map(async (exercise) => {
                    const { data: logs, error: logsError } = await supabase
                        .from('recommendation_logs')
                        .select('latest_form_score')
                        .eq('patient_id', patientId)
                        .eq('exercise_type', exercise.exercise_type)
                        .order('created_at', { ascending: false }) // newest entry first
                        .limit(1)

                    if (logsError) throw logsError

                    return {
                        exercise_type: exercise.exercise_type,
                        latest_form_score: logs?.[0]?.latest_form_score ?? null,
                    }
                })
            )

            // Step 4 — merge into the cache without overwriting other patients' data
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