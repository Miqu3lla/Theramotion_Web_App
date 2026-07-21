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
    <div className="flex flex-col gap-4">
      {editingNote && (
        <div className="flex items-center justify-between gap-3 bg-secondary-container text-on-secondary-container rounded-lg px-4 py-2.5">
          <span className="text-body-sm font-semibold">Editing note</span>
          <button
            onClick={onCancel}
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
            {editingNote && removeExistingFile && editingFileName && (
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
          {editingNote ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {isSaving ? 'Saving...' : editingNote ? 'Update Note' : 'Save Note'}
        </button>
      </div>
    </div>
  );
}
