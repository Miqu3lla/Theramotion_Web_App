import { create } from 'zustand'
import { useState, useMemo, useEffect } from 'react'
import { supabase } from '../utils/db'
import { queryClient } from '../lib/queryClient'
import type { Patient } from '../types/models'

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

export function usePatientSearch(patients: Patient[] | null) {
  const [search, setSearch] = useState('');
  // Debounced value avoids re-filtering (and, if search moves server-side,
  // firing a network request) on every single keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Memoised so the filter only re-runs when the patient list or search term changes,
  // not on every unrelated parent re-render.
  const filteredPatients = useMemo(() => {
    if (!patients) return [];
    const query = debouncedSearch.toLowerCase();
    return patients.filter(
      patient =>
        patient.first_name?.toLowerCase().includes(query) ||
        patient.last_name?.toLowerCase().includes(query)
    );
  }, [patients, debouncedSearch]);

  return { search, setSearch, filteredPatients };
}