
import usePatientStore from '../store/patientStore';
import { useEffect } from 'react';
import Navbar from '../components/Homepage/Navbar';
import PatientCard from '../components/Homepage/PatientCard';

export default function Homepage() {
  const { fetchPatients, patients, isLoading, error } = usePatientStore()

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar />
      
      <main className="flex-1 w-full px-6 md:px-10 py-8 mx-auto">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-8">
          <div>
            <p className="text-body-md text-on-surface-variant mb-2">
              Thursday, October 26
            </p>
            <h1 className="text-display font-display font-bold text-on-surface">
              Good morning nigga
            </h1>
          </div>
          
          <div className="mt-6 md:mt-0 relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text" 
              placeholder="Find by name, ID, or condition..." 
              className="w-full pl-10 pr-4 py-2.5 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-body-md"
            />
          </div>
        </div>

        {/* Recent Patients section */}
        <section>
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-outline-variant">
            <h2 className="text-title-lg font-display font-bold text-on-surface">
              All Patients
            </h2>
            <button className="text-primary font-label-md font-bold hover:text-primary-container flex items-center gap-1">
              View All Directory
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="bg-error-container text-on-error-container p-4 rounded-md">
              <p>Error loading patients: {error}</p>
            </div>
          ) : !patients || patients.length === 0 ? (
            <div className="bg-surface-container-low border border-outline-variant border-dashed p-12 rounded-xl text-center">
              <p className="text-body-lg text-on-surface-variant">No patients found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {patients.map((patient) => (
                <PatientCard key={patient.id} patient={patient} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
