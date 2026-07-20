import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../utils/db'
import type { HomeVisit } from '../types/models'

interface ScheduleVisitArgs {
  patientId: string
  scheduledAt: string
  notes?: string
}

export function useScheduleVisit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ patientId, scheduledAt, notes }: ScheduleVisitArgs) => {
      const { data, error } = await supabase
        .from('home_visits')
        .insert({
          patient_id: patientId,
          scheduled_at: scheduledAt,
          notes: notes ?? null,
        })
        .select('id, patient_id, scheduled_at, notes, status')
        .single()

      if (error) {
        console.error('Error scheduling home visit:', error)
        throw error
      }

      return data as HomeVisit
    },
    onSuccess: (data, variables) => {
      // Invalidate both the upcoming visits query and the specific patient's history query
      // so they automatically refetch the new data
      queryClient.invalidateQueries({ queryKey: ['upcoming-visits'] })
      queryClient.invalidateQueries({ queryKey: ['visit-history', variables.patientId] })
    },
  })
}
