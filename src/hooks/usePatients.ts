import { useQuery } from '@tanstack/react-query'
import { supabase } from '../utils/db'
import type { Patient } from './usePatientSearch'

// Fetches all patients from the patients table. Cached under ['patients'].
export function usePatients() {
  return useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('id, first_name, last_name, affected_area, affected_side')

      if (error) throw error
      if (!data) throw new Error('No patients found')

      return data
    },
  })
}
