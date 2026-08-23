import { X, CalendarClock } from 'lucide-react';
import { useVisitHistory } from '../../hooks/useVisitHistory';
import type { Patient } from '../../types/models';


interface VisitHistoryModalProps {
  patient: Patient | null;
  onClose: () => void;
}

// Reskinned status colors on the tm palette — same three states as before
// (completed / cancelled / scheduled), just mapped to the new tokens.
const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  completed: { bg: '#F1F6EF', fg: 'var(--tm-good)' },
  cancelled: { bg: '#FBF1EA', fg: 'var(--tm-warn)' },
  scheduled: { bg: 'var(--tm-tan)', fg: 'var(--tm-tan-icon)' },
};

export default function VisitHistoryModal({ patient, onClose }: VisitHistoryModalProps) {
  const { data: visits = [], isLoading, error: queryError } = useVisitHistory(patient?.id);
  const error = queryError?.message ?? null;

  if (!patient) return null;

  return (
    <div
      className="tm-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="tm-modal-panel" style={{ maxWidth: 620, maxHeight: '80vh' }}>
        <div className="tm-modal-header">
          <div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 500, color: 'var(--tm-ink)', margin: 0 }}>
              Visit History
            </h2>
            <p className="tm-patient-area" style={{ marginTop: 2 }}>
              {patient.first_name} {patient.last_name}
            </p>
          </div>
          <button onClick={onClose} className="tm-modal-close" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="tm-modal-body">
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--tm-forest)' }} />
            </div>
          ) : error ? (
            <div className="tm-error-banner">{error}</div>
          ) : visits.length === 0 ? (
            <div className="tm-empty-state">
              <CalendarClock className="h-9 w-9 mx-auto" />
              <p style={{ fontSize: 14 }}>No visits found for this patient.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {visits.map((visit) => {
                // timeZone: 'UTC' prevents JS from shifting the locally-stored timestamp
                const date = new Date(visit.scheduled_at).toLocaleString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  timeZone: 'UTC'
                });
                const style = STATUS_STYLE[visit.status] ?? STATUS_STYLE.scheduled;

                return (
                  <div key={visit.id} className="tm-content-card" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: visit.notes ? 8 : 0 }}>
                      <h4 style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--tm-ink)', margin: 0 }}>{date}</h4>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 100,
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          background: style.bg,
                          color: style.fg,
                          flexShrink: 0,
                        }}
                      >
                        {visit.status}
                      </span>
                    </div>
                    {visit.notes ? (
                      <p style={{ fontSize: 13, color: 'var(--tm-muted)', margin: 0, whiteSpace: 'pre-wrap' }}>
                        {visit.notes}
                      </p>
                    ) : (
                      <p style={{ fontSize: 13, color: 'var(--tm-muted-light)', fontStyle: 'italic', margin: 0 }}>
                        No notes provided.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
