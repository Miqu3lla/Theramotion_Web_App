import { useState } from 'react';
import ScheduleVisitModal from '../Modals/ScheduleVisitModal';
import VisitHistoryModal from '../Modals/VisitHistoryModal';
import type { Patient } from '../../types/models';
import type { HomeVisit } from '../../types/models';

interface PatientCardProps {
  patient: Patient;
  nextVisit?: HomeVisit | null;
  onViewProfile?: (patient: Patient) => void;
  onLogNote?: (patient: Patient) => void;
  isActive?: boolean;
}

// Rotates the three mockup accent themes (sage / coral / tan) across patients.
// Keyed by patient id (not list position) so the same patient always gets the
// same color whether shown in the main grid or the directory modal.
const AVATAR_THEMES = [
  { bg: 'var(--tm-sage)', fg: 'var(--tm-sage-icon)' },
  { bg: 'var(--tm-coral)', fg: 'var(--tm-coral-icon)' },
  { bg: 'var(--tm-tan)', fg: 'var(--tm-tan-icon)' },
];

function avatarTheme(id: string) {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return AVATAR_THEMES[sum % AVATAR_THEMES.length];
}

export default function PatientCard({ patient, nextVisit = null, onViewProfile, onLogNote, isActive = false }: PatientCardProps) {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Human-readable label for the upcoming home visit, e.g. "Oct 24, 2:00 PM".
  // timeZone: 'UTC' prevents JS from applying the local offset to the stored value —
  // since scheduled_at is stored as a local time string (no UTC conversion),
  // displaying it in UTC reads it exactly as typed (e.g. 1:30 AM stays 1:30 AM).
  const nextVisitLabel = nextVisit
    ? new Date(nextVisit.scheduled_at).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'UTC',
      })
    : null;

  const initials = [patient.first_name?.[0], patient.last_name?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || '?';

  const displayText = patient.affected_area === 'both' && patient.affected_side === 'both' ? 'Both arms and legs' : `${patient.affected_side} - ${patient.affected_area}`

  const theme = avatarTheme(patient.id);

  return (
    <>
    <div className="tm-patient-card">
      <div className="tm-patient-top">
        <div className="tm-patient-id">
          <div className="tm-patient-initials" style={{ background: theme.bg, color: theme.fg }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <p className="tm-patient-name">{patient.first_name} {patient.last_name}</p>
            <p className="tm-patient-area">{displayText}</p>
          </div>
        </div>
        <span className={`tm-status-pill${isActive ? ' active' : ''}`}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Trend row — only claims what real, already-loaded data supports.
          A live-session flag is real (Supabase Presence); we don't yet fetch
          every visible patient's performance scores up front, so we don't
          fabricate a performance direction here. */}
      {isActive ? (
        <div className="tm-trend-row">
          <span className="tm-trend-dot"></span>
          Currently in a live session
        </div>
      ) : (
        <div className="tm-trend-row neutral">
          <span className="tm-trend-dot"></span>
          Open profile for latest performance
        </div>
      )}

      <div className="tm-info-row">
        <span className="tm-label">Home Visit</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="tm-link" onClick={() => setIsScheduleOpen(true)}>
            {nextVisitLabel ?? 'Schedule visit'}
          </button>
          <button
            className="tm-link"
            style={{ color: 'var(--tm-muted)', fontSize: 12 }}
            onClick={() => setIsHistoryOpen(true)}
          >
            History
          </button>
        </div>
      </div>

      <div className="tm-card-actions">
        <button className="tm-btn" onClick={() => onLogNote?.(patient)}>Log Note</button>
        <button className="tm-btn primary" onClick={() => onViewProfile?.(patient)}>View Profile</button>
      </div>
    </div>

    {isScheduleOpen && (
      <ScheduleVisitModal patient={patient} onClose={() => setIsScheduleOpen(false)} />
    )}

    {isHistoryOpen && (
      <VisitHistoryModal patient={patient} onClose={() => setIsHistoryOpen(false)} />
    )}
    </>
  );
}
