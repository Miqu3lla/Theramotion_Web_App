import { useState } from 'react';

export interface Patient {
  id: string;
  first_name?: string;
  last_name?: string;
  affected_area?: string;
  affected_side?: string;
}

export function usePatientSearch(patients: Patient[] | null) {
  const [search, setSearch] = useState('');

  const filteredPatients = (() => {
    if (!patients) return [];
    const query = search.toLowerCase();
    return patients.filter(patient =>
      patient.first_name?.toLowerCase().includes(query) ||
      patient.last_name?.toLowerCase().includes(query)
    );
  })();

  return { search, setSearch, filteredPatients };
}
