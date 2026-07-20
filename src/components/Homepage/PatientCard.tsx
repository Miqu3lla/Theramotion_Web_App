import { useState } from 'react';
import ScheduleVisitModal from '../Modals/ScheduleVisitModal';
import VisitHistoryModal from '../Modals/VisitHistoryModal';
import type { Patient } from '../../hooks/usePatientSearch';
import type { HomeVisit } from '../../types/models';

interface PatientCardProps {
  patient: Patient;
  nextVisit?: HomeVisit | null;
  onViewProfile?: (patient: Patient) => void;
  onLogNote?: (patient: Patient) => void;
  isActive?: boolean;
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

  return (
    <>
    <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant flex flex-col justify-between hover:shadow-sm transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-3 items-center">
          <div className="w-12 h-12 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center text-title-lg font-bold">
            {initials}
          </div>
          <div>
            <h3 className="text-body-lg font-display font-semibold text-on-surface">
              {patient.first_name} {patient.last_name}
            </h3>
            <p className="text-body-sm text-on-surface-variant">
              {displayText}
            </p>
          </div>
        </div>
        <div className={`px-2 py-1 rounded border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-surface-container text-on-surface-variant border-outline-variant'}`}>
          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>}
          {isActive ? 'Active' : 'Inactive'}
        </div>
      </div>
      
      <div className="space-y-2 mb-5">
        <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="font-semibold mr-1">Home Visit:</span>
          <button
            onClick={() => setIsScheduleOpen(true)}
            className="text-primary hover:underline font-medium"
          >
            {nextVisitLabel ?? 'Schedule visit'}
          </button>
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="ml-auto text-primary text-xs hover:bg-primary-container bg-surface-container-high px-2.5 py-1 rounded-md transition-colors"
          >
            History
          </button>
        </div>
        <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-semibold mr-1">Next:</span> Today, 2:00 PM
        </div>
      </div>
      
      <div className="border-t border-outline-variant pt-4 flex gap-3">
        <button
          onClick={() => onLogNote?.(patient)}
          className="flex-1 bg-surface-container-lowest text-on-surface py-2 px-4 rounded-md font-label-md border border-outline-variant hover:bg-surface-container transition-colors text-center font-semibold"
        >
          Log Note
        </button>
        <button
          onClick={() => onViewProfile?.(patient)}
          className="flex-1 bg-primary text-on-primary py-2 px-4 rounded-md font-label-md hover:bg-primary-container transition-colors text-center font-semibold"
        >
          View Profile
        </button>
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
