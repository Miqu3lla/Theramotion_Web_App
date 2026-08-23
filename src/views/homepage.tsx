
import { useEffect, useState, useMemo } from 'react';

import PatientCard from '../components/Homepage/PatientCard';
import PatientDirectoryModal from '../components/Modals/PatientDirectoryModal';
import PatientPerformanceModal from '../components/Modals/PatientPerformanceModal';
import PatientNotesModal from '../components/Modals/PatientNotesModal';
import Pagination from '../components/ui/Pagination';
import { usePatientSearch } from '../store/patientStore';
import { usePatients } from '../hooks/usePatients';
import { useUpcomingVisits } from '../hooks/useUpcomingVisits';
import type { Patient } from '../types/models';
import { supabase } from '../utils/db';

// Formats a stored "local time as typed" timestamp (no timezone suffix) as a
// YYYY-MM-DD string, matching the UTC-read-back convention already used in
// PatientCard/VisitHistoryModal so the stored value reads back exactly as
// entered rather than being shifted by the browser's offset.
function toLocalDateKey(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'UTC' });
}

export default function Homepage() {
  // TanStack Query handles caching + loading + error for both fetches
  const { data: patients = null, isLoading, error: patientsError } = usePatients()
  const { data: nextVisits = {} } = useUpcomingVisits()
  const error = patientsError?.message ?? null
  const [activePatientIds, setActivePatientIds] = useState<string[]>([]);

  // Memoised so the greeting string is computed once on mount, not on every render.
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, [])

  // Small-caps eyebrow date, e.g. "SUNDAY · AUG 23"
  const eyebrowDate = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options).replace(',', ' ·').toUpperCase();
  }, [])

  // useEffect to track which patients are currently in an active session
  useEffect(() => {
    // 1. Join the 'tracking' channel in Supabase
    const patientSub = supabase.channel('tracking')

    // 2. Listen for 'sync' events on the 'presence' state
    // This fires whenever a user joins or leaves the channel
    patientSub.on('presence', {event: 'sync' }, () => {
      // 3. Get the latest online users
      const newState = patientSub.presenceState()

      // 4. Extract just the patient IDs from the presence data
      const activePatients = Object.values(newState).flat().map((presence: any) => presence.patient_id);

      // 5. Update our React state with the list of active patient IDs
      setActivePatientIds(activePatients)
    })

    // 6. Start the subscription to begin receiving updates
    patientSub.subscribe()

    // 7. Cleanup function: Leave the channel when the component unmounts
    return () => {
      supabase.removeChannel(patientSub)
    }
  }, []);

  const { search, setSearch, filteredPatients } = usePatientSearch(patients)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [notesPatient, setNotesPatient] = useState<Patient | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Sort patients so online ones appear first
  const sortedPatients = useMemo(() => {
    return [...filteredPatients].sort((a, b) => {
      const aOnline = activePatientIds.includes(a.id);
      const bOnline = activePatientIds.includes(b.id);
      if (aOnline === bOnline) return 0;
      return aOnline ? -1 : 1;
    });
  }, [filteredPatients, activePatientIds]);

  const itemsPerPage = 8;
  const totalPages = Math.ceil(sortedPatients.length / itemsPerPage);
  const paginatedPatients = sortedPatients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Summary strip metrics — every number here comes from data already loaded
  // by usePatients/useUpcomingVisits/presence (no extra fetches added).
  const todayKey = useMemo(() => toLocalDateKey(new Date().toISOString()), [])
  const visitsToday = useMemo(
    () => Object.values(nextVisits).filter((v) => toLocalDateKey(v.scheduled_at) === todayKey).length,
    [nextVisits, todayKey]
  )
  const caseloadCount = patients?.length ?? 0
  const activeNowCount = activePatientIds.length
  const upcomingCount = Object.keys(nextVisits).length

  return (
    <div className="tm-page">
      <main className="tm-wrap">
        <p className="tm-eyebrow">{eyebrowDate}</p>
        <h1 className="tm-greeting">{greeting}</h1>

        <div className="tm-summary-strip">
          <div className="tm-summary-card">
            <div className="tm-eyebrow2">Today</div>
            <div className="tm-summary-num">{visitsToday}</div>
            <div className="tm-summary-sub">visits scheduled</div>
          </div>
          <div className="tm-summary-card alt">
            <div className="tm-eyebrow2">Caseload</div>
            <div className="tm-summary-num">{caseloadCount}</div>
            <div className="tm-summary-sub">patients under your care</div>
          </div>
          <div className="tm-summary-card alt">
            <div className="tm-eyebrow2">Active now</div>
            <div className="tm-summary-num">{activeNowCount}</div>
            <div className="tm-summary-sub">in a live session</div>
          </div>
          <div className="tm-summary-card alt">
            <div className="tm-eyebrow2">Upcoming</div>
            <div className="tm-summary-num">{upcomingCount}</div>
            <div className="tm-summary-sub">home visits scheduled ahead</div>
          </div>
        </div>

        <div className="tm-section-head">
          <h2 className="tm-section-title">Patients</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div className="tm-search-wrap">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Find by name, ID, or condition..."
                className="tm-search-input"
              />
            </div>
            <button onClick={() => setIsModalOpen(true)} className="tm-view-all">
              View All Directory →
            </button>
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, color: 'var(--tm-muted)' }}>
            Loading...
          </div>
        ) : error ? (
          <div style={{ background: '#FBF1EA', color: 'var(--tm-warn)', padding: 16, borderRadius: 14 }}>
            Error loading patients: {error}
          </div>
        ) : !patients || patients.length === 0 ? (
          <div style={{ background: 'var(--tm-cream-card)', border: '1px dashed var(--tm-border-soft)', padding: 48, borderRadius: 20, textAlign: 'center', color: 'var(--tm-muted)' }}>
            No patients found.
          </div>
        ) : filteredPatients.length === 0 ? (
          <div style={{ background: 'var(--tm-cream-card)', border: '1px dashed var(--tm-border-soft)', padding: 48, borderRadius: 20, textAlign: 'center', color: 'var(--tm-muted)' }}>
            No matching patients found.
          </div>
        ) : (
          <>
            <div className="tm-patient-grid" style={{ marginBottom: 32 }}>
              {paginatedPatients.map((patient) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  nextVisit={nextVisits[patient.id] ?? null}
                  onViewProfile={setSelectedPatient}
                  onLogNote={setNotesPatient}
                  isActive={activePatientIds.includes(patient.id)}
                />
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={filteredPatients.length}
              onPageChange={setCurrentPage}
              itemName="patients"
            />
          </>
        )}
      </main>

      {/* Directory modal passes onViewProfile up so both it and the main grid
          share a single PatientPerformanceModal instance below. */}
      <PatientDirectoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        patients={patients}
        onViewProfile={setSelectedPatient}
        onLogNote={setNotesPatient}
        activePatientIds={activePatientIds}
        nextVisits={nextVisits}
      />
      <PatientPerformanceModal
        patient={selectedPatient}
        onClose={() => setSelectedPatient(null)}
      />
      <PatientNotesModal
        key={notesPatient?.id ?? 'none'}
        patient={notesPatient}
        onClose={() => setNotesPatient(null)}
      />
    </div>
  );
}
