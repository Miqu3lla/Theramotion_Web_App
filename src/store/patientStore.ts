import { create } from 'zustand'
import { supabase } from '../utils/db'
import { queryClient } from '../lib/queryClient'

interface PatientState {
    isLoading: boolean
    error: string | null
    scheduleHomeVisit: (patientId: string, scheduledAt: string, notes?: string) => Promise<void>
}

const usePatientStore = create<PatientState>((set) => ({
    isLoading: false,
    error: null,

    // Inserts a new scheduled visit and invalidates the TanStack query cache
    scheduleHomeVisit: async (patientId, scheduledAt, notes) => {
        set({ isLoading: true, error: null })
        try {
            const { error } = await supabase
                .from('home_visits')
                .insert({ patient_id: patientId, scheduled_at: scheduledAt, notes: notes ?? null })

            if (error) throw error

            // Invalidate queries so that the UI immediately refetches the fresh data
            queryClient.invalidateQueries({ queryKey: ['upcoming-visits'] })
            queryClient.invalidateQueries({ queryKey: ['visit-history', patientId] })
            
            set({ isLoading: false })
        } catch (error: any) {
            console.error('Error scheduling home visit:', error)
            set({ isLoading: false, error: error.message })
            throw error
        }
    },
}))

export default usePatientStore