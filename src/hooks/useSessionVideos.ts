import { useQuery } from '@tanstack/react-query'
import { supabase } from '../utils/db'

// Bucket layout: {patient_id}/{video_id}/{filename}.mp4
const BUCKET = 'session-evidence'
const SIGNED_URL_TTL = 60 * 60 // 1 hour, enough to load and watch a video

export interface SessionVideo {
  id: string // the video_id folder name
  path: string // full storage path, e.g. "<patient_id>/<video_id>/<filename>"
  fileName: string
  updatedAt: string | null
  url: string | null
}

export function useSessionVideos(patientId: string | undefined) {
  return useQuery<SessionVideo[]>({
    queryKey: ['session-videos', patientId],
    enabled: !!patientId,
    queryFn: async () => {
      if (!patientId) return []

      // First level: one subfolder per recorded video, named by video id
      const { data: entries, error: listError } = await supabase
        .storage
        .from(BUCKET)
        .list(patientId, { sortBy: { column: 'name', order: 'desc' } })

      if (listError) throw listError

      // Supabase storage returns folders as entries with no file id/metadata
      const videoFolders = (entries ?? []).filter((entry) => entry.id === null)

      // Second level: the actual video file inside each video_id folder
      const videoLists = await Promise.all(
        videoFolders.map(async (folder) => {
          const folderPath = `${patientId}/${folder.name}`
          const { data: files, error: filesError } = await supabase
            .storage
            .from(BUCKET)
            .list(folderPath)

          if (filesError) throw filesError

          return (files ?? [])
            .filter((file) => file.id !== null)
            .map((file) => ({
              id: folder.name,
              path: `${folderPath}/${file.name}`,
              fileName: file.name,
              updatedAt: file.updated_at ?? file.created_at ?? null,
            }))
        })
      )

      const videos = videoLists.flat()
      if (videos.length === 0) return []

      // Batch-sign every video path in one round trip rather than one call per video
      const { data: signedUrls, error: signError } = await supabase
        .storage
        .from(BUCKET)
        .createSignedUrls(videos.map((v) => v.path), SIGNED_URL_TTL)

      if (signError) throw signError

      return videos.map((video, i) => ({
        ...video,
        url: signedUrls?.[i]?.signedUrl ?? null,
      }))
    },
  })
}
