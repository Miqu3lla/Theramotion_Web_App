import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { X, Plus, Printer, Trash2, Paperclip, FileText, NotebookPen, Eye, Download, Pencil, Check } from 'lucide-react';
import useNoteStore, { ClinicalNote } from '../../store/noteStore';
import type { Patient } from '../../hooks/usePatientSearch';
import FilePreviewModal, { PreviewFile, PreviewKind } from './FilePreviewModal';

interface PatientNotesModalProps {
  patient: Patient | null;
  onClose: () => void;
}

type Tab = 'all' | 'write';

// Attachment types the picker should surface: PDF, Word, Excel, PowerPoint,
// plain text/CSV/RTF, OpenDocument, and images. Extensions are the most reliable
// filter across browsers; image/* covers scanned photos of paper notes.
const ACCEPTED_FILE_TYPES = [
  '.pdf',
  '.doc', '.docx',
  '.xls', '.xlsx',
  '.ppt', '.pptx',
  '.txt', '.csv', '.rtf',
  '.odt', '.ods', '.odp',
  'image/*',
].join(',');

const MAX_FILE_SIZE_MB = 25;

// Decide how an attachment can be previewed in-app from its extension. Images
// render in an <img>; PDFs and plain-text formats render in an <iframe>;
// everything else (Word/Excel/etc.) falls back to a download prompt.
function previewKindFor(name: string | null): PreviewKind {
  const ext = name?.split('.').pop()?.toLowerCase() ?? '';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'avif'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (['txt', 'csv', 'log', 'md', 'json'].includes(ext)) return 'text';
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return 'office';
  return 'other';
}

// Friendly absolute date+time for note timestamps.
function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function PatientNotesModal({ patient, onClose }: PatientNotesModalProps) {
  const { fetchNotes, createNote, updateNote, deleteNote, getFileUrl, notesByPatient, isLoading, isSaving, error } = useNoteStore();

  const [tab, setTab] = useState<Tab>('all');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [noteToPrint, setNoteToPrint] = useState<ClinicalNote | null>(null);
  // When set, the Write tab is editing this existing note rather than creating a
  // new one. removeExistingFile tracks whether the saved attachment was cleared.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingFileName, setEditingFileName] = useState<string | null>(null);
  const [removeExistingFile, setRemoveExistingFile] = useState(false);
  // The attachment currently open in the in-app preview modal, plus its storage
  // path so the preview's Download button can re-sign a download URL.
  const [preview, setPreview] = useState<(PreviewFile & { path: string }) | null>(null);

  // Load this patient's notes when the modal opens. The parent gives this
  // component a key={patient.id}, so it remounts per patient and the form/tab
  // state above resets to its initial values without an effect.
  const patientId = patient?.id;
  useEffect(() => {
    if (patientId) fetchNotes(patientId);
  }, [patientId, fetchNotes]);

  // While the modal is open, stop the browser's default "open the dropped file"
  // behavior anywhere on the page, so a near-miss on the drop zone is harmless.
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

  // Render the hidden printable node synchronously, then open the print dialog.
  // flushSync guarantees #print-root is in the DOM before window.print() runs.
  const handlePrint = (note: ClinicalNote) => {
    flushSync(() => setNoteToPrint(note));
    window.print();
  };

  if (!patient) return null;

  const notes = notesByPatient[patient.id];

  const initials = [patient.first_name?.[0], patient.last_name?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || '?';

  const patientName = `${patient.first_name ?? ''} ${patient.last_name ?? ''}`.trim() || 'Patient';

  // Validate a chosen file's size before accepting it. Shared by the file picker
  // and drag-and-drop. Type is already guided by the input's accept list; size
  // can't be enforced there so we check it here.
  const acceptFile = (picked: File | null) => {
    if (picked && picked.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setFileError(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      setFile(null);
      return;
    }
    setFileError(null);
    setFile(picked);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    acceptFile(e.target.files?.[0] ?? null);
  };

  // Intercept the drop so the browser doesn't navigate to / open the file.
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    acceptFile(e.dataTransfer.files?.[0] ?? null);
  };

  // Clear the Write form back to a blank "new note" state.
  const resetForm = () => {
    setEditingId(null);
    setEditingFileName(null);
    setRemoveExistingFile(false);
    setTitle('');
    setContent('');
    setFile(null);
    setFileError(null);
  };

  // Load an existing note into the Write tab for editing.
  const startEdit = (note: ClinicalNote) => {
    setEditingId(note.id);
    setEditingFileName(note.file_url ? note.file_name : null);
    setRemoveExistingFile(false);
    setTitle(note.title ?? '');
    setContent(note.content ?? '');
    setFile(null);
    setFileError(null);
    setTab('write');
  };

  // Whether a saved attachment is still present (not removed, not replaced).
  const keepingExistingFile = !!editingFileName && !removeExistingFile && !file;

  const handleSave = async () => {
    if (!title.trim() && !content.trim() && !file && !keepingExistingFile) return;

    const ok = editingId
      ? await updateNote({ noteId: editingId, patientId: patient.id, title, content, file, removeFile: removeExistingFile })
      : await createNote({ patientId: patient.id, title, content, file });

    if (ok) {
      resetForm();
      setTab('all');
    }
  };

  // Private bucket → fetch a short-lived signed URL, then open the attachment in
  // the in-app preview modal so the admin can read it without leaving the app.
  // Text files are fetched and rendered by us (white panel) instead of relying
  // on the browser's dark default styling for raw text.
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

  // Force a download with the original filename via a Content-Disposition URL.
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

  const canSave = (title.trim() || content.trim() || file || keepingExistingFile) && !isSaving;

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
              onClick={() => setTab('all')}
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
              onClick={() => { if (!editingId) resetForm(); setTab('write'); }}
              className={`px-4 py-3 text-body-md font-semibold border-b-2 -mb-px transition-colors flex items-center gap-2 ${
                tab === 'write'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <NotebookPen className="h-4 w-4" />
              {editingId ? 'Edit' : 'Write'}
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
              // ---- Write tab ----
              <div className="flex flex-col gap-4">
                {editingId && (
                  <div className="flex items-center justify-between gap-3 bg-secondary-container text-on-secondary-container rounded-lg px-4 py-2.5">
                    <span className="text-body-sm font-semibold">Editing note</span>
                    <button
                      onClick={() => { resetForm(); setTab('all'); }}
                      className="text-body-sm font-semibold hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                <div>
                  <label className="block text-body-sm font-semibold text-on-surface-variant mb-1.5">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Session summary — Oct 24"
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-body-md"
                  />
                </div>
                <div>
                  <label className="block text-body-sm font-semibold text-on-surface-variant mb-1.5">Note</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Type the clinical note here..."
                    rows={8}
                    className="w-full px-4 py-3 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-body-md resize-y"
                  />
                </div>
                <div>
                  <label className="block text-body-sm font-semibold text-on-surface-variant mb-1.5">Attachment (optional)</label>
                  {keepingExistingFile ? (
                    // Editing a note whose saved attachment is unchanged: show it
                    // with the option to replace or remove.
                    <div className="flex items-center gap-3 flex-wrap bg-surface-container rounded-lg px-3 py-2">
                      <span className="inline-flex items-center gap-2 text-body-sm text-on-surface min-w-0">
                        <Paperclip className="h-4 w-4 shrink-0 text-on-surface-variant" />
                        <span className="truncate">{editingFileName}</span>
                      </span>
                      <div className="flex items-center gap-3 ml-auto">
                        <label className="text-body-sm text-primary font-semibold hover:underline cursor-pointer">
                          Replace
                          <input type="file" className="hidden" accept={ACCEPTED_FILE_TYPES} onChange={handleFileChange} />
                        </label>
                        <button
                          onClick={() => setRemoveExistingFile(true)}
                          className="text-body-sm text-error font-semibold hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <label
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                        onDrop={handleDrop}
                        className={`flex items-center gap-2 px-4 py-2.5 border border-dashed rounded-lg cursor-pointer transition-colors text-body-md ${
                          isDragging
                            ? 'border-primary bg-primary-fixed/40 text-on-surface'
                            : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container'
                        }`}
                      >
                        <Paperclip className="h-4 w-4" />
                        <span className="truncate">
                          {file ? file.name : isDragging ? 'Drop the file here' : 'Choose a file or drag it here'}
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept={ACCEPTED_FILE_TYPES}
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="mt-1.5 text-body-sm text-on-surface-variant">
                        PDF, Word, Excel, PowerPoint, text or images — up to {MAX_FILE_SIZE_MB}MB.
                      </p>
                      {fileError && (
                        <p className="mt-1 text-body-sm text-error">{fileError}</p>
                      )}
                      {file && (
                        <button
                          onClick={() => { setFile(null); setFileError(null); }}
                          className="mt-1.5 text-body-sm text-error hover:underline"
                        >
                          Remove attachment
                        </button>
                      )}
                      {editingId && removeExistingFile && editingFileName && (
                        <p className="mt-1.5 text-body-sm text-on-surface-variant">
                          Saved attachment will be removed.{' '}
                          <button
                            onClick={() => setRemoveExistingFile(false)}
                            className="text-primary font-semibold hover:underline"
                          >
                            Undo
                          </button>
                        </p>
                      )}
                    </>
                  )}
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSave}
                    disabled={!canSave}
                    className="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-label-md font-semibold hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                  >
                    {editingId ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {isSaving ? 'Saving...' : editingId ? 'Update Note' : 'Save Note'}
                  </button>
                </div>
              </div>
            ) : (
              // ---- All Notes tab ----
              isLoading || notes === undefined ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-10 w-10 mx-auto text-on-surface-variant mb-3 opacity-60" />
                  <p className="text-body-md text-on-surface-variant mb-4">No notes yet for this patient.</p>
                  <button
                    onClick={() => setTab('write')}
                    className="text-primary font-semibold hover:underline inline-flex items-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" /> Write the first note
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4"
                    >
                      <div className="flex justify-between items-start gap-3 mb-2">
                        <div>
                          <h4 className="text-body-lg font-semibold text-on-surface">
                            {note.title || 'Untitled note'}
                          </h4>
                          <p className="text-body-sm text-on-surface-variant">{formatDate(note.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => startEdit(note)}
                            className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
                            aria-label="Edit note"
                            title="Edit note"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handlePrint(note)}
                            className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
                            aria-label="Print note"
                            title="Print note"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteNote(note.id, patient.id)}
                            className="p-2 rounded-full hover:bg-error-container text-on-surface-variant hover:text-on-error-container transition-colors"
                            aria-label="Delete note"
                            title="Delete note"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {note.content && (
                        <p className="text-body-md text-on-surface whitespace-pre-wrap mb-3">{note.content}</p>
                      )}

                      {note.file_url && (
                        <div className="flex items-center gap-3 flex-wrap bg-surface-container rounded-lg px-3 py-2">
                          <span className="inline-flex items-center gap-2 text-body-sm text-on-surface min-w-0">
                            <Paperclip className="h-4 w-4 shrink-0 text-on-surface-variant" />
                            <span className="truncate">{note.file_name || 'Attachment'}</span>
                          </span>
                          <div className="flex items-center gap-3 ml-auto">
                            <button
                              onClick={() => handleViewFile(note.file_url!, note.file_name)}
                              className="inline-flex items-center gap-1.5 text-body-sm text-primary font-semibold hover:underline"
                            >
                              <Eye className="h-4 w-4" /> View
                            </button>
                            <button
                              onClick={() => handleDownloadFile(note.file_url!, note.file_name)}
                              className="inline-flex items-center gap-1.5 text-body-sm text-primary font-semibold hover:underline"
                            >
                              <Download className="h-4 w-4" /> Download
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Printable area — hidden on screen, isolated by @media print rules in index.css */}
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
