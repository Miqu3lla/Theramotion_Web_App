import { useState } from 'react';
import usePatientStore from '../../store/patientStore';
import type { Patient } from '../../types/models';

interface ScheduleVisitModalProps {
  patient: Patient | null;
  onClose: () => void;
}

export default function ScheduleVisitModal({ patient, onClose }: ScheduleVisitModalProps) {
  const scheduleHomeVisit = usePatientStore((s) => s.scheduleHomeVisit);

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');            // therapist-typed, e.g. "2:30"
  const [meridiem, setMeridiem] = useState<'AM' | 'PM'>('AM');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!patient) return null;

  // Prevents picking a date in the past. Format matches the date input (yyyy-mm-dd).
  // Using local date parts avoids the UTC shift that toISOString() would cause.
  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Parses a manually typed "h:mm" (or "h") string into 24-hour parts using the
  // selected AM/PM. Returns null if it isn't a valid time.
  const parseTime = (raw: string): { hours: number; minutes: number } | null => {
    const match = raw.trim().match(/^(\d{1,2})(?::(\d{2}))?$/);
    if (!match) return null;
    let hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    if (hours < 1 || hours > 12 || minutes > 59) return null;
    // Convert 12-hour to 24-hour: 12 AM -> 0, 12 PM -> 12, otherwise add 12 for PM.
    if (meridiem === 'AM') hours = hours === 12 ? 0 : hours;
    else hours = hours === 12 ? 12 : hours + 12;
    return { hours, minutes };
  };

  const handleSave = async () => {
    if (!date) {
      setError('Please pick a date.');
      return;
    }
    const parsed = parseTime(time);
    if (!parsed) {
      setError('Enter a time like 2:30 and choose AM or PM.');
      return;
    }

    // Store as a local time string so the DB value matches exactly what the
    // therapist typed (e.g. 1:30 AM stays 1:30 AM in the DB, not converted to UTC).
    const [year, month, day] = date.split('-').map(Number);
    const when = new Date(year, month - 1, day, parsed.hours, parsed.minutes);

    if (when.getTime() < Date.now()) {
      setError('That time is in the past.');
      return;
    }

    // Build a timezone-free ISO string from the local Date object's getters.
    const pad = (n: number) => String(n).padStart(2, '0');
    const localIso = `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}T${pad(when.getHours())}:${pad(when.getMinutes())}:00`;

    setIsSaving(true);
    setError(null);
    try {
      await scheduleHomeVisit(patient.id, localIso, notes.trim() || undefined);
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
              Visit date
            </label>
            <input
              id="visit-date"
              type="date"
              value={date}
              min={minDate}
              onChange={(e) => setDate(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-body-md text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="visit-time" className="text-body-sm font-semibold text-on-surface">
              Time
            </label>
            <div className="flex gap-2">
              <input
                id="visit-time"
                type="text"
                inputMode="numeric"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="2:30"
                className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-body-md text-on-surface focus:outline-none focus:border-primary"
              />
              <select
                aria-label="AM or PM"
                value={meridiem}
                onChange={(e) => setMeridiem(e.target.value as 'AM' | 'PM')}
                className="bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-body-md text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
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
