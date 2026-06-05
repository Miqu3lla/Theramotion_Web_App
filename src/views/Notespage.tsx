import { Link } from 'react-router-dom';

export default function Notespage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
      <div className="bg-surface-container-lowest p-10 rounded-xl shadow-sm border border-outline-variant text-center max-w-md w-full">
        <span className="material-symbols-outlined text-[64px] text-primary mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>note_alt</span>
        <h1 className="text-display font-display font-bold text-on-surface mb-4">
          Notes
        </h1>
        <p className="text-body-lg text-on-surface-variant mb-8">
          This is a placeholder page for the Notes feature.
        </p>
        <Link 
          to="/home"
          className="px-6 py-3 bg-primary text-on-primary rounded-lg font-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm inline-flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
