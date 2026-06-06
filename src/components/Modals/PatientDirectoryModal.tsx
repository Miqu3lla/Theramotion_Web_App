import  { useState } from 'react';
import PatientCard from '../Homepage/PatientCard';

interface Patient {
  id: string;
  first_name?: string
  last_name?: string
  affected_area?: string
  affected_side?: string
}

interface PatientDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[] | null;
}

export default function PatientDirectoryModal({ isOpen, onClose, patients }: PatientDirectoryModalProps) {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredPatients = patients?.filter(patient => 
    patient.first_name?.toLowerCase().includes(search.toLowerCase())
   || patient.last_name?.toLowerCase().includes(search.toLowerCase())) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface w-full max-w-5xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-xl">
        <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
          <h2 className="text-title-lg font-display font-bold text-on-surface">Patient Directory</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 border-b border-outline-variant bg-surface">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search patients in directory..." 
              className="w-full pl-10 pr-4 py-3 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-body-md"
            />
          </div>
        </div>

        <div className="p-6 overflow-y-auto bg-surface flex-1">
          {patients === null ? (
             <div className="text-center py-8 text-on-surface-variant">Loading patients...</div>
          ) : filteredPatients.length === 0 ? (
             <div className="text-center py-8 text-on-surface-variant">No matching patients found.</div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredPatients.map((patient) => (
                <PatientCard key={patient.id} patient={patient} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
