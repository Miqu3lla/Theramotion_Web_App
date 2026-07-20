import { useQuery } from '@tanstack/react-query'
import { supabase } from '../utils/db'
import type { HomeVisit } from '../store/patientStore'

// Fetches all upcoming scheduled visits and keeps only the latest one per patient.
// Cached under ['upcoming-visits'].
export function useUpcomingVisits() {
  return useQuery<Record<string, HomeVisit>>({
    queryKey: ['upcoming-visits'],
    queryFn: async () => {
      // Compare against local time to match how scheduled_at is stored —
      // values like '2026-07-24T01:30:00' in the DB represent the local time
      // the therapist typed, not UTC.
      const now = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      const nowLocalIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

      const { data, error } = await supabase
        .from('home_visits')
        .select('id, patient_id, scheduled_at, notes, status')
        .eq('status', 'scheduled')
        .gte('scheduled_at', nowLocalIso)
        .order('scheduled_at', { ascending: false }) // latest upcoming first

      if (error) throw error

      // Rows are sorted descending (latest first), so the first visit seen
      // per patient is their furthest upcoming visit — matching the workflow
      // where a new follow-up date is always added after each completed visit.
      const map: Record<string, HomeVisit> = {}
      for (const visit of (data ?? []) as HomeVisit[]) {
        if (!map[visit.patient_id]) map[visit.patient_id] = visit
      }

      return map
    },
  })
}
