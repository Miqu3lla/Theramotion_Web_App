import { Video } from 'lucide-react';
import { useSessionVideos } from '../../hooks/useSessionVideos';

interface PatientVideosSectionProps {
  patientId: string | undefined;
}

// Turns a filename like "hand_to_mouth.mp4" into "Hand To Mouth"
function labelFor(fileName: string) {
  const stem = fileName.replace(/\.[^.]+$/, '');
  return stem
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

export default function PatientVideosSection({ patientId }: PatientVideosSectionProps) {
  const { data: videos = [], isLoading, error } = useSessionVideos(patientId);

  return (
    <div className="mt-6">
      <h3 className="text-body-md font-semibold text-on-surface-variant uppercase tracking-wider text-[11px] mb-3">
        Session Videos
      </h3>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-error-container text-on-error-container p-4 rounded-md">
          <p className="text-body-md font-medium">Failed to load session videos.</p>
          <p className="text-body-sm mt-1">{error.message}</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="bg-surface-container-low border border-outline-variant border-dashed p-10 rounded-xl text-center">
          <Video className="h-8 w-8 mx-auto text-on-surface-variant mb-3 opacity-60" />
          <p className="text-body-lg text-on-surface-variant font-medium">No session videos yet</p>
          <p className="text-body-sm text-on-surface-variant mt-1">Recorded exercise sessions for this patient will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {videos.map((video) => (
            <div
              key={video.path}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden"
            >
              {video.url ? (
                <video
                  src={video.url}
                  controls
                  preload="metadata"
                  className="w-full aspect-video bg-black"
                />
              ) : (
                <div className="w-full aspect-video bg-surface-container flex items-center justify-center">
                  <Video className="h-8 w-8 text-on-surface-variant opacity-60" />
                </div>
              )}
              <div className="px-3 py-2">
                <p className="text-body-sm font-semibold text-on-surface truncate">{labelFor(video.fileName)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
