
import usePatientStore from '../store/patientStore';
import { useEffect, useState } from 'react';

import PatientCard from '../components/Homepage/PatientCard';
import PatientDirectoryModal from '../components/Modals/PatientDirectoryModal';

export default function Homepage() {
  const { fetchPatients, patients, isLoading, error} = usePatientStore()
  const [greeting, setGreeting] = useState("")


  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const filteredPatients = patients?.filter(patient => 
    patient.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  //function to get the current date
  const getCurrentDate = () => {
     const date = new Date()
    //use Intl.datetimeFormatOptions to let typescript know that this is a valid date format
     const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: 'numeric'

      }
      return date.toLocaleDateString("en-US", options)
  }
  //function to get the current hour for greeting
  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) {
      setGreeting("Good morning")
    } else if (hour < 18) {
      setGreeting("Good afternoon")
    } else {
      setGreeting("Good evening")
    }
  }

  useEffect(() => {
    getGreeting()
  }, [])

  
  
  

  return (
    <div className="flex-1 w-full bg-surface">

      <main className="flex-1 w-full px-6 md:px-10 py-8 mx-auto">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-8">
          <div>
            <p className="text-body-md text-on-surface-variant mb-2">
              {getCurrentDate()}
            </p>
            <h1 className="text-display font-display font-bold text-on-surface">
              {greeting}
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
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Find by name, ID, or condition..." 
              className="w-full pl-10 pr-4 py-2.5 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-body-md"
            />
          </div>
        </div>

        {/* Recent Patients section */}
        <section>
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-outline-variant">
            <h2 className="text-title-lg font-display font-bold text-on-surface">
              Patients
            </h2>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="text-primary font-label-md font-bold hover:text-primary-container flex items-center gap-1"
            >
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
          ) : filteredPatients.length === 0 ? (
            <div className="bg-surface-container-low border border-outline-variant border-dashed p-12 rounded-xl text-center">
              <p className="text-body-lg text-on-surface-variant">No matching patients found.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {paginatedPatients.map((patient) => (
                  <PatientCard key={patient.id} patient={patient} />
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between border-t border-outline-variant pt-6 mt-2 gap-4">
                  <span className="text-body-sm text-on-surface-variant font-medium">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredPatients.length)} of {filteredPatients.length} patients
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-outline-variant rounded-md text-label-md font-medium text-on-surface hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    
                    <div className="flex items-center gap-1 hidden sm:flex">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 flex items-center justify-center rounded-md text-label-md font-medium transition-colors ${
                            currentPage === page 
                              ? 'bg-primary text-on-primary' 
                              : 'text-on-surface hover:bg-surface-container'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-outline-variant rounded-md text-label-md font-medium text-on-surface hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>
      
      <PatientDirectoryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        patients={patients} 
      />
    </div>
  );
}
