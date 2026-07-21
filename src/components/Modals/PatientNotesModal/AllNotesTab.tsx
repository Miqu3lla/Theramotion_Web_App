import { FileText, Plus, Pencil, Printer, Trash2, Paperclip, Eye, Download } from 'lucide-react';
import type { ClinicalNote, Patient } from '../../../types/models';
import { formatDate } from './utils';

interface AllNotesTabProps {
  patient: Patient;
  notes: ClinicalNote[] | undefined;
  isLoading: boolean;
  onWriteNew: () => void;
  onEdit: (note: ClinicalNote) => void;
  onPrint: (note: ClinicalNote) => void;
  onDelete: (id: string, patientId: string) => void;
  onViewFile: (path: string, name: string | null) => void;
  onDownloadFile: (path: string, name: string | null) => void;
}

export default function AllNotesTab({
  patient,
  notes,
  isLoading,
  onWriteNew,
  onEdit,
  onPrint,
  onDelete,
  onViewFile,
  onDownloadFile,
}: AllNotesTabProps) {
  if (isLoading || notes === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-10 w-10 mx-auto text-on-surface-variant mb-3 opacity-60" />
        <p className="text-body-md text-on-surface-variant mb-4">No notes yet for this patient.</p>
        <button
          onClick={onWriteNew}
          className="text-primary font-semibold hover:underline inline-flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> Write the first note
        </button>
      </div>
    );
  }

  return (
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
                onClick={() => onEdit(note)}
                className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
                aria-label="Edit note"
                title="Edit note"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => onPrint(note)}
                className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
                aria-label="Print note"
                title="Print note"
              >
                <Printer className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(note.id, patient.id)}
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
                  onClick={() => onViewFile(note.file_url!, note.file_name)}
                  className="inline-flex items-center gap-1.5 text-body-sm text-primary font-semibold hover:underline"
                >
                  <Eye className="h-4 w-4" /> View
                </button>
                <button
                  onClick={() => onDownloadFile(note.file_url!, note.file_name)}
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
  );
}
