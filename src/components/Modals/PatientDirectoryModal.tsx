import { X, Search } from 'lucide-react';
import PatientCard from '../Homepage/PatientCard';
import { usePatientSearch } from '../../store/patientStore';
import type { Patient, HomeVisit } from '../../types/models';


interface PatientDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[] | null;
  // Lifted to the parent (Homepage) so there is a single PatientPerformanceModal
  // instance and a single source of truth for the selected patient, eliminating
  // the risk of duplicate Supabase fetches from two independent modal instances.
  onViewProfile: (patient: Patient) => void;
  onLogNote: (patient: Patient) => void;
  activePatientIds: string[];
  nextVisits: Record<string, HomeVisit>;
}

export default function PatientDirectoryModal({ isOpen, onClose, patients, onViewProfile, onLogNote, activePatientIds, nextVisits }: PatientDirectoryModalProps) {
  const { search, setSearch, filteredPatients } = usePatientSearch(patients);

  if (!isOpen) return null;

  return (
    <div className="tm-modal-overlay">
      <div className="tm-modal-panel" style={{ maxWidth: 880, maxHeight: '90vh' }}>
        <div className="tm-modal-header">
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 500, color: 'var(--tm-ink)', margin: 0 }}>
            Patient Directory
          </h2>
          <button onClick={onClose} className="tm-modal-close" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div style={{ padding: '18px 26px', borderBottom: '1px solid var(--tm-border-soft)', background: 'var(--tm-cream-card)' }}>
          <div className="tm-search-wrap" style={{ maxWidth: '100%' }}>
            <Search className="h-4 w-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patients in directory..."
              className="tm-search-input"
            />
          </div>
        </div>

        <div className="tm-modal-body" style={{ background: 'var(--tm-cream)' }}>
          {patients === null ? (
            <div className="tm-empty-state" style={{ padding: 32 }}>Loading patients...</div>
          ) : filteredPatients.length === 0 ? (
            <div className="tm-empty-state" style={{ padding: 32 }}>No matching patients found.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {filteredPatients.map((patient) => (
                <PatientCard key={patient.id} patient={patient} nextVisit={nextVisits[patient.id] ?? null} onViewProfile={onViewProfile} onLogNote={onLogNote} isActive={activePatientIds.includes(patient.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
