interface Patient {
  id: string;
  first_name?: string;
  last_name?: string;
  affected_area?: string;
  affected_side?: string;
}

interface PatientCardProps {
  patient: Patient;
}

export default function PatientCard({ patient }: PatientCardProps) {

  const displayText = patient.affected_area === 'both' && patient.affected_side === 'both' ? 'Both arms and legs' : `${patient.affected_side} - ${patient.affected_area}`

  return (
    <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant flex flex-col justify-between hover:shadow-sm transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-3 items-center">
          <div className="w-12 h-12 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center text-title-lg font-bold">
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
        <div className="px-2 py-1 bg-surface-container text-on-surface-variant rounded border border-outline-variant text-[10px] font-bold uppercase tracking-wider">
          Active
        </div>
      </div>
      
      <div className="space-y-2 mb-5">
        <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="font-semibold mr-1">Last Session:</span> Oct 24, 2023
        </div>
        <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-semibold mr-1">Next:</span> Today, 2:00 PM
        </div>
      </div>
      
      <div className="border-t border-outline-variant pt-4 flex gap-3">
        <button className="flex-1 bg-surface-container-lowest text-on-surface py-2 px-4 rounded-md font-label-md border border-outline-variant hover:bg-surface-container transition-colors text-center font-semibold">
          Log Note
        </button>
        <button className="flex-1 bg-primary text-on-primary py-2 px-4 rounded-md font-label-md hover:bg-primary-container transition-colors text-center font-semibold">
          View Profile
        </button>
      </div>
    </div>
  );
}
