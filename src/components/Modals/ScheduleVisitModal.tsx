import { useState } from 'react';
import { X } from 'lucide-react';
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
      className="tm-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="tm-modal-panel" style={{ maxWidth: 440, maxHeight: '90vh' }}>

        {/* Header */}
        <div className="tm-modal-header">
          <div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 500, color: 'var(--tm-ink)', margin: 0 }}>
              Schedule Home Visit
            </h2>
            <p className="tm-patient-area" style={{ marginTop: 2 }}>
              {patient.first_name} {patient.last_name}
            </p>
          </div>
          <button onClick={onClose} className="tm-modal-close" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="tm-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label htmlFor="visit-date" className="tm-field-label">
              Visit date
            </label>
            <input
              id="visit-date"
              type="date"
              value={date}
              min={minDate}
              onChange={(e) => setDate(e.target.value)}
              className="tm-text-input"
            />
          </div>

          <div>
            <label htmlFor="visit-time" className="tm-field-label">
              Time
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                id="visit-time"
                type="text"
                inputMode="numeric"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="2:30"
                className="tm-text-input"
                style={{ flex: 1 }}
              />
              <select
                aria-label="AM or PM"
                value={meridiem}
                onChange={(e) => setMeridiem(e.target.value as 'AM' | 'PM')}
                className="tm-text-input"
                style={{ width: 80, flexShrink: 0 }}
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="visit-notes" className="tm-field-label">
              Notes <span style={{ fontWeight: 400, color: 'var(--tm-muted-light)' }}>(optional)</span>
            </label>
            <textarea
              id="visit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="e.g. bring resistance bands, gate code 1234"
              className="tm-text-input"
              style={{ resize: 'none' }}
            />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: 'var(--tm-warn)', margin: 0 }}>{error}</p>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '0 26px 26px', display: 'flex', gap: 12 }}>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="tm-btn"
            style={{ opacity: isSaving ? 0.5 : 1 }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="tm-btn primary"
            style={{ opacity: isSaving ? 0.5 : 1 }}
          >
            {isSaving ? 'Saving…' : 'Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}
