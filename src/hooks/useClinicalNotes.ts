import { useQuery } from '@tanstack/react-query'
import { supabase } from '../utils/db'
import type { ClinicalNote } from '../types/models'

export function useClinicalNotes(patientId: string | undefined) {
  return useQuery<ClinicalNote[]>({
    queryKey: ['clinical-notes', patientId],
    enabled: !!patientId,
    queryFn: async () => {
      if (!patientId) return []

      const { data, error } = await supabase
        .from('clinical_notes')
        .select('id, patient_id, therapist_id, title, content, file_url, file_name, created_at, updated_at')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data as ClinicalNote[]
    },
  })
}
