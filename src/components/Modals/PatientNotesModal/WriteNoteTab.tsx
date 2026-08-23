import { useState, useEffect } from 'react';
import { Paperclip, Plus, Check } from 'lucide-react';
import useNoteStore from '../../../store/noteStore';
import type { ClinicalNote, Patient } from '../../../types/models';

interface WriteNoteTabProps {
  patient: Patient;
  editingNote: ClinicalNote | null;
  onSuccess: () => void;
  onCancel: () => void;
  ACCEPTED_FILE_TYPES: string;
  MAX_FILE_SIZE_MB: number;
}

export default function WriteNoteTab({
  patient,
  editingNote,
  onSuccess,
  onCancel,
  ACCEPTED_FILE_TYPES,
  MAX_FILE_SIZE_MB,
}: WriteNoteTabProps) {
  const { createNote, updateNote, isSaving } = useNoteStore();

  const [title, setTitle] = useState(editingNote?.title ?? '');
  const [content, setContent] = useState(editingNote?.content ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [removeExistingFile, setRemoveExistingFile] = useState(false);

  // Sync state if editingNote changes while mounted (though typically it mounts anew)
  useEffect(() => {
    if (editingNote) {
      setTitle(editingNote.title ?? '');
      setContent(editingNote.content ?? '');
    } else {
      setTitle('');
      setContent('');
    }
    setFile(null);
    setFileError(null);
    setRemoveExistingFile(false);
  }, [editingNote]);

  const editingFileName = editingNote?.file_url ? editingNote.file_name : null;
  const keepingExistingFile = !!editingFileName && !removeExistingFile && !file;

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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    acceptFile(e.dataTransfer.files?.[0] ?? null);
  };

  const handleSave = async () => {
    if (!title.trim() && !content.trim() && !file && !keepingExistingFile) return;

    const ok = editingNote
      ? await updateNote({
          noteId: editingNote.id,
          patientId: patient.id,
          title,
          content,
          file,
          removeFile: removeExistingFile,
        })
      : await createNote({
          patientId: patient.id,
          title,
          content,
          file,
        });

    if (ok) {
      onSuccess();
    }
  };

  const canSave = (title.trim() || content.trim() || file || keepingExistingFile) && !isSaving;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {editingNote && (
        <div className="tm-banner">
          <span>Editing note</span>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', fontWeight: 700, color: 'inherit', textDecoration: 'underline' }}>
            Cancel
          </button>
        </div>
      )}

      <div className="tm-content-card" style={{ padding: 20 }}>
        <div style={{ marginBottom: 14 }}>
          <label className="tm-field-label">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Session summary — Oct 24"
            className="tm-text-input"
          />
        </div>
        <div>
          <label className="tm-field-label">Note</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a note about today's visit — form, adherence, pain, anything worth flagging..."
            rows={7}
            className="tm-text-input"
            style={{ resize: 'vertical', minHeight: 90 }}
          />
        </div>
      </div>

      <div>
        <label className="tm-field-label">Attachment (optional)</label>
        {keepingExistingFile ? (
          <div className="tm-attachment-row">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--tm-ink)', minWidth: 0 }}>
              <Paperclip className="h-4 w-4" style={{ color: 'var(--tm-muted)', flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{editingFileName}</span>
            </span>
            <div style={{ display: 'flex', gap: 12, marginLeft: 'auto' }}>
              <label className="tm-inline-link" style={{ cursor: 'pointer' }}>
                Replace
                <input type="file" className="hidden" accept={ACCEPTED_FILE_TYPES} onChange={handleFileChange} />
              </label>
              <button onClick={() => setRemoveExistingFile(true)} className="tm-inline-link danger">
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
              className={`tm-dropzone${isDragging ? ' dragging' : ''}`}
            >
              <Paperclip className="h-4 w-4" />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file ? file.name : isDragging ? 'Drop the file here' : 'Choose a file or drag it here'}
              </span>
              <input
                type="file"
                className="hidden"
                accept={ACCEPTED_FILE_TYPES}
                onChange={handleFileChange}
              />
            </label>
            <p style={{ marginTop: 6, fontSize: 12.5, color: 'var(--tm-muted)' }}>
              PDF, Word, Excel, PowerPoint, text or images — up to {MAX_FILE_SIZE_MB}MB.
            </p>
            {fileError && (
              <p style={{ marginTop: 4, fontSize: 12.5, color: 'var(--tm-warn)' }}>{fileError}</p>
            )}
            {file && (
              <button onClick={() => { setFile(null); setFileError(null); }} className="tm-inline-link danger" style={{ marginTop: 6 }}>
                Remove attachment
              </button>
            )}
            {editingNote && removeExistingFile && editingFileName && (
              <p style={{ marginTop: 6, fontSize: 12.5, color: 'var(--tm-muted)' }}>
                Saved attachment will be removed.{' '}
                <button onClick={() => setRemoveExistingFile(false)} className="tm-inline-link" style={{ fontSize: 12.5 }}>
                  Undo
                </button>
              </p>
            )}
          </>
        )}
      </div>

      <div className="tm-composer-footer">
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="tm-btn primary"
          style={{ opacity: canSave ? 1 : 0.5, cursor: canSave ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          {editingNote ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {isSaving ? 'Saving...' : editingNote ? 'Update Note' : 'Save Note'}
        </button>
      </div>
    </div>
  );
}
