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
    <div style={{ marginTop: 28 }}>
      <p className="tm-eyebrow" style={{ marginBottom: 12 }}>Session videos</p>

      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--tm-forest)' }} />
        </div>
      ) : error ? (
        <div className="tm-error-banner">
          <p style={{ fontWeight: 700, margin: 0 }}>Failed to load session videos.</p>
          <p style={{ margin: '4px 0 0', fontSize: 13 }}>{error.message}</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="tm-empty-state">
          <Video className="h-9 w-9 mx-auto" />
          <p style={{ fontWeight: 600, color: 'var(--tm-ink)', marginBottom: 4 }}>No session videos yet</p>
          <p style={{ fontSize: 13 }}>Recorded exercise sessions for this patient will appear here.</p>
        </div>
      ) : (
        <div className="tm-video-grid">
          {videos.map((video) => (
            <div key={video.path} className="tm-video-card">
              {video.url ? (
                <video src={video.url} controls preload="metadata" />
              ) : (
                <div className="tm-video-placeholder">
                  <Video className="h-8 w-8" style={{ opacity: 0.6 }} />
                </div>
              )}
              <div className="tm-video-label">{labelFor(video.fileName)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
