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
    scheduleHomeVisit: (patientId: string, scheduledAt: string, notes?: string) => Promise<void>,
}

const usePatientStore = create<PatientState>((set) => ({
    isLoading: false,
    isLoadingScores: false,
    error: null,
    patients: null,

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

        // We no longer update the local cache here because nextVisits is managed
        // by TanStack Query. The component using useScheduleVisit mutation will
        // invalidate the query to refetch.
    },

}))

export default usePatientStore