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
        className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4 print:hidden"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="bg-surface w-full max-w-2xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-xl">
          {/* Header */}
          <div className="p-6 border-b border-outline-variant flex justify-between items-start bg-surface-container-lowest">
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center text-title-lg font-bold shrink-0">
                {initials}
              </div>
              <div>
                <h2 className="text-title-lg font-display font-bold text-on-surface">{patientName}</h2>
                <p className="text-body-sm text-on-surface-variant">Clinical Notes</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors shrink-0"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-outline-variant bg-surface px-6">
            <button
              onClick={() => { setTab('all'); setEditingNote(null); }}
              className={`px-4 py-3 text-body-md font-semibold border-b-2 -mb-px transition-colors flex items-center gap-2 ${
                tab === 'all'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <FileText className="h-4 w-4" />
              All Notes {notes ? `(${notes.length})` : ''}
            </button>
            <button
              onClick={() => { if (!editingNote) setEditingNote(null); setTab('write'); }}
              className={`px-4 py-3 text-body-md font-semibold border-b-2 -mb-px transition-colors flex items-center gap-2 ${
                tab === 'write'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <NotebookPen className="h-4 w-4" />
              {editingNote ? 'Edit' : 'Write'}
            </button>
          </div>

          {error && (
            <div className="mx-6 mt-4 bg-error-container text-on-error-container p-3 rounded-md text-body-sm">
              {error}
            </div>
          )}

          {/* Body */}
          <div className="px-6 py-5 overflow-y-auto bg-surface flex-1">
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
