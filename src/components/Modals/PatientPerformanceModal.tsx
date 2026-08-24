import { X, Dumbbell } from 'lucide-react';
import { usePerformanceScores } from '../../hooks/usePerformanceScores';
import PatientVideosSection from './PatientVideosSection';

interface Patient {
  id: string;
  first_name?: string;
  last_name?: string;
  affected_area?: string;
  affected_side?: string;
}

interface PatientPerformanceModalProps {
  patient: Patient | null;
  onClose: () => void;
}

// Same three-color rotation as the dashboard's PatientCard/notes avatars,
// applied here to each exercise's icon badge.
const ICON_THEMES = [
  { bg: 'var(--tm-sage)', fg: 'var(--tm-sage-icon)' },
  { bg: 'var(--tm-coral)', fg: 'var(--tm-coral-icon)' },
  { bg: 'var(--tm-tan)', fg: 'var(--tm-tan-icon)' },
];

// Score tier — same thresholds the app has always used (>=75 good, >=50 mid,
// else needs attention), just reskinned. A missing score is its own 'none'
// tier so unavailable data never reads as poor performance.
function scoreTier(score: number | null): 'good' | 'mid' | 'low' | 'none' {
  if (score === null) return 'none';
  if (score >= 75) return 'good';
  if (score >= 50) return 'mid';
  return 'low';
}
const TIER_FILL: Record<string, string> = { good: 'var(--tm-good)', mid: 'var(--tm-tan-icon)', low: 'var(--tm-warn)', none: 'var(--tm-border-soft)' };
const TIER_LABEL: Record<string, string> = { good: 'On track', mid: 'Fair', low: 'Needs attention', none: 'No data' };

export default function PatientPerformanceModal({ patient, onClose }: PatientPerformanceModalProps) {
  const { data: scores = [], isLoading: isLoadingScores, error: performanceError } = usePerformanceScores(patient?.id);

  // Nothing to render if no patient is selected
  if (!patient) return null;

  // Build initials from first and last name for the avatar
  const initials = [patient.first_name?.[0], patient.last_name?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || '?';

  // Format the affected area label shown under the patient name
  const displayText =
    patient.affected_area === 'both' && patient.affected_side === 'both'
      ? 'Both arms and legs'
      : `${patient.affected_side} - ${patient.affected_area}`;

  return (
    <div
      className="tm-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="tm-modal-panel" style={{ maxWidth: 620, maxHeight: '90vh' }}>

        {/* Header */}
        <div className="tm-modal-header">
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div className="tm-patient-initials" style={{ width: 48, height: 48, fontSize: 15, background: 'var(--tm-sage)', color: 'var(--tm-sage-icon)' }}>
              {initials}
            </div>
            <div>
              <p className="tm-patient-name" style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 500, whiteSpace: 'normal' }}>
                {patient.first_name} {patient.last_name}
              </p>
              <p className="tm-patient-area">{displayText}</p>
            </div>
          </div>
          <button onClick={onClose} className="tm-modal-close" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="tm-modal-body">
          <p className="tm-eyebrow" style={{ marginBottom: 4 }}>Performance</p>

          {isLoadingScores ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--tm-forest)' }} />
            </div>
          ) : performanceError ? (
            <div className="tm-error-banner" style={{ margin: '12px 0' }}>
              <p style={{ fontWeight: 700, margin: 0 }}>Failed to load performance scores.</p>
              <p style={{ margin: '4px 0 0', fontSize: 13 }}>{performanceError.message}</p>
            </div>
          ) : scores.length === 0 ? (
            <div className="tm-empty-state">
              <Dumbbell className="h-9 w-9 mx-auto" />
              <p style={{ fontWeight: 600, color: 'var(--tm-ink)', marginBottom: 4 }}>No recent performance data</p>
              <p style={{ fontSize: 13 }}>This patient hasn't completed any tracked exercises recently.</p>
            </div>
          ) : (
            <>
              <h2 className="tm-section-title" style={{ marginTop: 12, marginBottom: 16, fontSize: 19 }}>By exercise</h2>
              <div className="tm-exercise-list">
                {scores.map((exercise, i) => {
                  const tier = scoreTier(exercise.latest_form_score);
                  const theme = ICON_THEMES[i % ICON_THEMES.length];
                  return (
                    <div key={exercise.exercise_type} className="tm-content-card tm-exercise-card" style={{ padding: 16, alignItems: 'center' }}>
                      <div className="tm-exercise-icon" style={{ background: theme.bg, color: theme.fg }}>
                        <Dumbbell className="h-[18px] w-[18px]" />
                      </div>
                      <div className="tm-exercise-info">
                        <p className="tm-exercise-name">{exercise.exercise_type.replace(/_/g, ' ')}</p>
                        <span className={`tm-score-badge ${tier}`}>{TIER_LABEL[tier]}</span>
                      </div>
                      <div style={{ flex: 1, maxWidth: 100 }}>
                        <div className="tm-progress-track">
                          <div className="tm-progress-fill" style={{ width: `${exercise.latest_form_score ?? 0}%`, background: TIER_FILL[tier] }} />
                        </div>
                      </div>
                      <div className="tm-exercise-score">
                        <div className="tm-num">{exercise.latest_form_score ?? '—'}</div>
                        <div className="tm-lbl">Score</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Session videos */}
          <PatientVideosSection patientId={patient.id} />
        </div>
      </div>
    </div>
  );
}
