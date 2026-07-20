import { useState } from 'react';
import usePatientStore from '../../store/patientStore';
import type { Patient } from '../../hooks/usePatientSearch';

interface ScheduleVisitModalProps {
  patient: Patient | null;
  onClose: () => void;
}

export default function ScheduleVisitModal({ patient, onClose }: ScheduleVisitModalProps) {
  const scheduleHomeVisit = usePatientStore((s) => s.scheduleHomeVisit);

  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!patient) return null;

  // Prevents scheduling a visit in the past. Format matches datetime-local input.
  const minDateTime = new Date().toISOString().slice(0, 16);

  const handleSave = async () => {
    if (!scheduledAt) {
      setError('Please pick a date and time.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      // datetime-local gives a local time with no zone; convert to a real ISO
      // (UTC) string so it is stored unambiguously.
      const iso = new Date(scheduledAt).toISOString();
      await scheduleHomeVisit(patient.id, iso, notes.trim() || undefined);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not schedule the visit.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface w-full max-w-md rounded-2xl flex flex-col overflow-hidden shadow-xl">

        {/* Header */}
        <div className="p-6 border-b border-outline-variant flex justify-between items-start bg-surface-container-lowest">
          <div>
            <h2 className="text-title-lg font-display font-bold text-on-surface">
              Schedule Home Visit
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

        {/* Body */}
        <div className="p-6 bg-surface flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="visit-date" className="text-body-sm font-semibold text-on-surface">
              Visit date &amp; time
            </label>
            <input
              id="visit-date"
              type="datetime-local"
              value={scheduledAt}
              min={minDateTime}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-body-md text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="visit-notes" className="text-body-sm font-semibold text-on-surface">
              Notes <span className="font-normal text-on-surface-variant">(optional)</span>
            </label>
            <textarea
              id="visit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="e.g. bring resistance bands, gate code 1234"
              className="bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-body-md text-on-surface resize-none focus:outline-none focus:border-primary"
            />
          </div>

          {error && (
            <p className="text-body-sm text-error">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 bg-surface flex gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 bg-surface-container-lowest text-on-surface py-2 px-4 rounded-md font-label-md border border-outline-variant hover:bg-surface-container transition-colors font-semibold disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-primary text-on-primary py-2 px-4 rounded-md font-label-md hover:bg-primary-container transition-colors font-semibold disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : 'Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}
