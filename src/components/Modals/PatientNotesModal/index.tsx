import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { X, FileText, NotebookPen } from 'lucide-react';
import useNoteStore from '../../../store/noteStore';
import { useClinicalNotes } from '../../../hooks/useClinicalNotes';
import type { ClinicalNote, Patient } from '../../../types/models';
import FilePreviewModal, { PreviewFile } from '../FilePreviewModal';

import WriteNoteTab from './WriteNoteTab';
import AllNotesTab from './AllNotesTab';
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE_MB, previewKindFor, formatDate } from './utils';

interface PatientNotesModalProps {
  patient: Patient | null;
  onClose: () => void;
}

type Tab = 'all' | 'write';

// Same avatar-accent rotation as the dashboard's PatientCard, keyed by patient
// id so the same patient reads with the same color everywhere.
const AVATAR_THEMES = [
  { bg: 'var(--tm-sage)', fg: 'var(--tm-sage-icon)' },
  { bg: 'var(--tm-coral)', fg: 'var(--tm-coral-icon)' },
  { bg: 'var(--tm-tan)', fg: 'var(--tm-tan-icon)' },
];
function avatarTheme(id: string) {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return AVATAR_THEMES[sum % AVATAR_THEMES.length];
}

export default function PatientNotesModal({ patient, onClose }: PatientNotesModalProps) {
  const patientId = patient?.id;
  const { data: notes = [], isLoading, error: queryError } = useClinicalNotes(patientId);
  const { deleteNote, getFileUrl, error: storeError } = useNoteStore();

  const error = queryError?.message || storeError || null;

  const [tab, setTab] = useState<Tab>('all');
  const [noteToPrint, setNoteToPrint] = useState<ClinicalNote | null>(null);
  const [editingNote, setEditingNote] = useState<ClinicalNote | null>(null);
  const [preview, setPreview] = useState<(PreviewFile & { path: string }) | null>(null);

  useEffect(() => {
    if (!patientId) return;
    const prevent = (e: DragEvent) => e.preventDefault();
    window.addEventListener('dragover', prevent);
    window.addEventListener('drop', prevent);
    return () => {
      window.removeEventListener('dragover', prevent);
      window.removeEventListener('drop', prevent);
    };
  }, [patientId]);

  const handlePrint = (note: ClinicalNote) => {
    flushSync(() => setNoteToPrint(note));
    window.print();
  };

  if (!patient) return null;

  const initials = [patient.first_name?.[0], patient.last_name?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || '?';

  const patientName = `${patient.first_name ?? ''} ${patient.last_name ?? ''}`.trim() || 'Patient';
  const displayArea = patient.affected_area === 'both' && patient.affected_side === 'both'
    ? 'Both arms and legs'
    : `${patient.affected_side} - ${patient.affected_area}`;
  const theme = avatarTheme(patient.id);

  const handleViewFile = async (path: string, name: string | null) => {
    const url = await getFileUrl(path);
    if (!url) return;
    const kind = previewKindFor(name);
    let text: string | undefined;
    if (kind === 'text') {
      try {
        text = await (await fetch(url)).text();
      } catch {
        text = 'Unable to load file contents. Try downloading the file instead.';
      }
    }
    setPreview({ url, name: name ?? 'Attachment', kind, text, path });
  };

  const handleDownloadFile = async (path: string, name: string | null) => {
    const url = await getFileUrl(path, name ?? 'attachment');
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = name ?? '';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const startEdit = (note: ClinicalNote) => {
    setEditingNote(note);
    setTab('write');
  };

  const resetAndGoToAll = () => {
    setEditingNote(null);
    setTab('all');
  };

  return (
    <>
      <div
        className="tm-modal-overlay print:hidden"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="tm-modal-panel" style={{ maxWidth: 640, maxHeight: '90vh' }}>
          {/* Header */}
          <div className="tm-modal-header">
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div className="tm-patient-initials" style={{ width: 48, height: 48, fontSize: 15, background: theme.bg, color: theme.fg }}>
                {initials}
              </div>
              <div>
                <p className="tm-patient-name" style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 500, whiteSpace: 'normal' }}>{patientName}</p>
                <p className="tm-patient-area">{displayArea}</p>
              </div>
            </div>
            <button onClick={onClose} className="tm-modal-close" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="tm-tabs">
            <button
              onClick={() => { setTab('all'); setEditingNote(null); }}
              className={`tm-tab-btn${tab === 'all' ? ' active' : ''}`}
            >
              <FileText className="h-4 w-4" />
              All Notes {notes ? `(${notes.length})` : ''}
            </button>
            <button
              onClick={() => { if (!editingNote) setEditingNote(null); setTab('write'); }}
              className={`tm-tab-btn${tab === 'write' ? ' active' : ''}`}
            >
              <NotebookPen className="h-4 w-4" />
              {editingNote ? 'Edit' : 'Write'}
            </button>
          </div>

          {error && (
            <div style={{ margin: '16px 26px 0' }} className="tm-error-banner">
              {error}
            </div>
          )}

          {/* Body */}
          <div className="tm-modal-body">
            {tab === 'write' ? (
              <WriteNoteTab
                patient={patient}
                editingNote={editingNote}
                onSuccess={resetAndGoToAll}
                onCancel={resetAndGoToAll}
                ACCEPTED_FILE_TYPES={ACCEPTED_FILE_TYPES}
                MAX_FILE_SIZE_MB={MAX_FILE_SIZE_MB}
              />
            ) : (
              <AllNotesTab
                patient={patient}
                notes={notes}
                isLoading={isLoading}
                onWriteNew={() => { setEditingNote(null); setTab('write'); }}
                onEdit={startEdit}
                onPrint={handlePrint}
                onDelete={deleteNote}
                onViewFile={handleViewFile}
                onDownloadFile={handleDownloadFile}
              />
            )}
          </div>
        </div>
      </div>

      {/* Printable area */}
      {noteToPrint && (
        <div id="print-root" className="hidden print:block p-10">
          <h1 className="text-3xl font-bold mb-1">{noteToPrint.title || 'Clinical Note'}</h1>
          <p className="text-sm mb-1">Patient: {patientName}</p>
          <p className="text-sm mb-6">{formatDate(noteToPrint.created_at)}</p>
          <hr className="mb-6" />
          <p className="whitespace-pre-wrap text-base leading-relaxed">{noteToPrint.content}</p>
          {noteToPrint.file_name && (
            <p className="text-sm mt-8 italic">Attachment: {noteToPrint.file_name}</p>
          )}
        </div>
      )}

      {/* In-app attachment viewer */}
      <FilePreviewModal
        file={preview}
        onClose={() => setPreview(null)}
        onDownload={() => { if (preview) handleDownloadFile(preview.path, preview.name); }}
      />
    </>
  );
}
