import { useEffect } from 'react';
import usePatientStore from '../../store/patientStore';

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

// Shows a color-coded pill badge based on score: blue = good, grey = moderate, red = poor/missing
function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <span className="px-2.5 py-1 rounded-full text-label-md font-bold bg-error-container text-on-error-container">
        No data
      </span>
    );
  }
  if (score >= 75) {
    return (
      <span className="px-2.5 py-1 rounded-full text-label-md font-bold bg-primary-fixed text-on-primary-fixed">
        {score}
      </span>
    );
  }
  if (score >= 50) {
    return (
      <span className="px-2.5 py-1 rounded-full text-label-md font-bold bg-secondary-container text-on-secondary-container">
        {score}
      </span>
    );
  }
  return (
    <span className="px-2.5 py-1 rounded-full text-label-md font-bold bg-error-container text-on-error-container">
      {score}
    </span>
  );
}

// Returns the Tailwind color class for the progress bar fill, matching the same thresholds as ScoreBadge
function progressColor(score: number | null) {
  if (score === null) return 'bg-outline-variant';
  if (score >= 75) return 'bg-primary';
  if (score >= 50) return 'bg-secondary';
  return 'bg-error';
}

export default function PatientPerformanceModal({ patient, onClose }: PatientPerformanceModalProps) {
  const { fetchPatientPerformanceScores, patientPerformanceScores, isLoadingScores } = usePatientStore();

  // Fetch scores whenever the selected patient changes.
  // fetchPatientPerformanceScores is included to satisfy exhaustive-deps and
  // avoid a stale closure (e.g., after HMR in development with React 19 strict mode).
  useEffect(() => {
    if (patient) {
      fetchPatientPerformanceScores(patient.id);
    }
  }, [patient?.id, fetchPatientPerformanceScores]);

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

  // Pull this patient's cached exercise scores from the store
  const scores = patientPerformanceScores[patient.id];

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface w-full max-w-lg max-h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-xl">

        {/* Header */}
        <div className="p-6 border-b border-outline-variant flex justify-between items-start bg-surface-container-lowest">
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center text-title-lg font-bold shrink-0">
              {initials}
            </div>
            <div>
              <h2 className="text-title-lg font-display font-bold text-on-surface">
                {patient.first_name} {patient.last_name}
              </h2>
              <p className="text-body-sm text-on-surface-variant">{displayText}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Sub-header label */}
        <div className="px-6 pt-5 pb-2 bg-surface">
          <h3 className="text-body-md font-semibold text-on-surface-variant uppercase tracking-wider text-[11px]">
            Exercise Performance
          </h3>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 overflow-y-auto bg-surface flex-1">
          {(isLoadingScores || scores === undefined) ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            </div>
          ) : scores.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant text-body-md">
              No exercise data found for this patient.
            </div>
          ) : (
            <div className="flex flex-col">
              {scores.map((exercise) => (
                <div
                  key={exercise.exercise_type}
                  className="py-4 border-b border-outline-variant last:border-b-0"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-body-md font-semibold text-on-surface capitalize">
                      {exercise.exercise_type}
                    </span>
                    <ScoreBadge score={exercise.latest_form_score} />
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 w-full rounded-full bg-outline-variant overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${progressColor(exercise.latest_form_score)}`}
                      style={{ width: `${exercise.latest_form_score ?? 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
