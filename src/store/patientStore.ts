import { create } from 'zustand'
import { supabase } from '../utils/db'
import type { Patient } from '../hooks/usePatientSearch'


// Patient type is defined once in usePatientSearch and re-used here to avoid
// duplicate declarations that cause TypeScript structural-typing mismatches.

interface ExerciseScore {
    exercise_type: string,
    latest_form_score: number | null,
}

export interface HomeVisit {
    id: string,
    patient_id: string,
    scheduled_at: string,
    notes: string | null,
    status: 'scheduled' | 'completed' | 'cancelled',
}

interface PatientState {
    isLoading: boolean,
    isLoadingScores: boolean,
    error: string | null,
    patients: Patient[] | null,
    patientPerformanceScores: Record<string, ExerciseScore[]>,
    // The soonest upcoming visit per patient id (null = none scheduled).
    nextVisits: Record<string, HomeVisit | null>,
    fetchPatients: () => Promise<void>,
    fetchPatientPerformanceScores: (patientId: string) => Promise<void>,
    fetchUpcomingVisits: () => Promise<void>,
    scheduleHomeVisit: (patientId: string, scheduledAt: string, notes?: string) => Promise<void>,
}

const usePatientStore = create<PatientState>((set) => ({
    isLoading: false,
    isLoadingScores: false,
    error: null,
    patients: null,
    // keyed by patient id so each patient's scores are cached separately
    patientPerformanceScores: {},
    // keyed by patient id, holds the soonest upcoming visit (or null)
    nextVisits: {},

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
            // fetches the exercise_type based on patient id and orders it by the created_at column
            const { data: predictions, error: predictionsError } = await supabase
                .from('form_predictions')
                .select('exercise_type')
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false })

            if (predictionsError) throw predictionsError

            //create a set to avoid duplicates
            const seen = new Set<string>()
            //filters out if the same exercise type has been seen before so it only takes the most recent one
            const recentExercises = (predictions ?? [])
                .filter(p => {
                    if (seen.has(p.exercise_type)) return false
                    seen.add(p.exercise_type)
                    return true
                })
                .slice(0, 3)

            //for each exercise fetch all of their scores and out of all fetch the only recent one per exercise
            //generates a promise.all function to put in a promise to all values and then put all scores in one go
            const scores: ExerciseScore[] = await Promise.all(
                //maps the score with the matching patient id and also the matching exercise type 
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
                        //returns the exercise type and the most recent score for that exercise
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

    // Fetches all of the therapist's upcoming (still-scheduled) visits and keeps
    // only the soonest one per patient. RLS already scopes rows to the current
    // therapist, so no therapist filter is needed here.
    fetchUpcomingVisits: async () => {
        try {
            const nowIso = new Date().toISOString()

            const { data, error } = await supabase
                .from('home_visits')
                .select('id, patient_id, scheduled_at, notes, status')
                .eq('status', 'scheduled')
                .gte('scheduled_at', nowIso)
                .order('scheduled_at', { ascending: true }) // soonest first

            if (error) throw error

            // Because rows are sorted ascending, the first one seen for a patient
            // is their soonest upcoming visit.
            const map: Record<string, HomeVisit> = {}
            for (const visit of (data ?? []) as HomeVisit[]) {
                if (!map[visit.patient_id]) map[visit.patient_id] = visit
            }

            set({ nextVisits: map })

        } catch (error: any) {
            console.error('Error fetching upcoming visits:', error)
            set({ error: error.message })
        }
    },

    // Inserts a new scheduled visit and refreshes the cached next visit for the
    // patient. therapist_id defaults to auth.uid() in the database.
    scheduleHomeVisit: async (patientId, scheduledAt, notes) => {
        const { data, error } = await supabase
            .from('home_visits')
            .insert({ patient_id: patientId, scheduled_at: scheduledAt, notes: notes ?? null })
            .select('id, patient_id, scheduled_at, notes, status')
            .single()

        if (error) {
            console.error('Error scheduling home visit:', error)
            throw error
        }

        const newVisit = data as HomeVisit

        // Only replace the cached next visit if this one is sooner (or none exists).
        set((state) => {
            const existing = state.nextVisits[patientId]
            const isSooner = !existing || new Date(newVisit.scheduled_at) < new Date(existing.scheduled_at)
            if (!isSooner) return {}
            return {
                nextVisits: { ...state.nextVisits, [patientId]: newVisit },
            }
        })
    },

}))

export default usePatientStore