import { useVisitHistory } from '../../hooks/useVisitHistory';
import type { Patient } from '../../hooks/usePatientSearch';
import type { HomeVisit } from '../../types/models';

interface VisitHistoryModalProps {
  patient: Patient | null;
  onClose: () => void;
}

export default function VisitHistoryModal({ patient, onClose }: VisitHistoryModalProps) {
  const { data: visits = [], isLoading, error: queryError } = useVisitHistory(patient?.id);
  const error = queryError?.message ?? null;

  if (!patient) return null;

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface w-full max-w-2xl max-h-[80vh] rounded-2xl flex flex-col overflow-hidden shadow-xl">
        <div className="p-6 border-b border-outline-variant flex justify-between items-start bg-surface-container-lowest">
          <div>
            <h2 className="text-title-lg font-display font-bold text-on-surface">
              Visit History
            </h2>
            <p className="text-body-sm text-on-surface-variant">
              {patient.first_name} {patient.last_name}
            </p>
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

        <div className="p-6 flex-1 overflow-y-auto bg-surface">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="bg-error-container text-on-error-container p-4 rounded-md text-body-md">
              {error}
            </div>
          ) : visits.length === 0 ? (
            <div className="text-center p-8 text-on-surface-variant text-body-lg">
              No visits found for this patient.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
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

                return (
                  <div key={visit.id} className="bg-surface-container-lowest border border-outline-variant p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-body-lg text-on-surface">{date}</h4>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        visit.status === 'completed' ? 'bg-green-100 text-green-700' :
                        visit.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {visit.status}
                      </span>
                    </div>
                    {visit.notes ? (
                      <p className="text-body-sm text-on-surface-variant mt-2 whitespace-pre-wrap">
                        {visit.notes}
                      </p>
                    ) : (
                      <p className="text-body-sm text-on-surface-variant italic mt-2">
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
