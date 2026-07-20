import { useQuery } from '@tanstack/react-query'
import { supabase } from '../utils/db'

export interface ExerciseScore {
  exercise_type: string
  latest_form_score: number | null
}

export function usePerformanceScores(patientId: string | undefined) {
  return useQuery<ExerciseScore[]>({
    // Cache per patient
    queryKey: ['performance-scores', patientId],
    // Only run the query if we actually have a patientId (modal is open)
    enabled: !!patientId,
    queryFn: async () => {
      if (!patientId) return []

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
        .filter((p) => {
          if (seen.has(p.exercise_type)) return false
          seen.add(p.exercise_type)
          return true
        })
        .slice(0, 3)

      //for each exercise fetch all of their scores and out of all fetch the only recent one per exercise
      //generates a promise.all function to put in a promise to all values and then put all scores in one go
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

      return scores
    },
  })
}
