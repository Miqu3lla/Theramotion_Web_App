import { useState, useMemo, useEffect } from 'react';

export interface Patient {
  id: string;
  first_name?: string;
  last_name?: string;
  affected_area?: string;
  affected_side?: string;
}

export function usePatientSearch(patients: Patient[] | null) {
  const [search, setSearch] = useState('');
  // Debounced value avoids re-filtering (and, if search moves server-side,
  // firing a network request) on every single keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Memoised so the filter only re-runs when the patient list or search term changes,
  // not on every unrelated parent re-render.
  const filteredPatients = useMemo(() => {
    if (!patients) return [];
    const query = debouncedSearch.toLowerCase();
    return patients.filter(
      patient =>
        patient.first_name?.toLowerCase().includes(query) ||
        patient.last_name?.toLowerCase().includes(query)
    );
  }, [patients, debouncedSearch]);

  return { search, setSearch, filteredPatients };
}
