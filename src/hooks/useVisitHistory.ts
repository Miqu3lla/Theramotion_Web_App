import { useQuery } from '@tanstack/react-query'
import { supabase } from '../utils/db'
import type { HomeVisit } from '../types/models'

// Fetches the full history of visits for a specific patient.
// Cached under ['visit-history', patientId].
export function useVisitHistory(patientId: string | undefined) {
  return useQuery<HomeVisit[]>({
    queryKey: ['visit-history', patientId],
    // Only run if we actually have an ID
    enabled: !!patientId,
    queryFn: async () => {
      if (!patientId) return []

      const { data, error } = await supabase
        .from('home_visits')
        .select('id, patient_id, scheduled_at, notes, status')
        .eq('patient_id', patientId)
        .order('scheduled_at', { ascending: false })

      if (error) throw error
      
      return data as HomeVisit[]
    },
  })
}
