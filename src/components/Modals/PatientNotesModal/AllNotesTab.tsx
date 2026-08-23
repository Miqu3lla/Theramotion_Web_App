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

// Splits a note's created_at into the mockup's day/month date-block, e.g. "23" / "Aug".
function dateParts(iso: string) {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString('en-US', { day: 'numeric' }),
    month: d.toLocaleDateString('en-US', { month: 'short' }),
  };
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--tm-forest)' }} />
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="tm-empty-state">
        <FileText className="h-9 w-9 mx-auto" />
        <p style={{ marginBottom: 14, fontSize: 14 }}>No notes yet for this patient.</p>
        <button onClick={onWriteNew} className="tm-inline-link" style={{ display: 'inline-flex', margin: '0 auto' }}>
          <Plus className="h-4 w-4" /> Write the first note
        </button>
      </div>
    );
  }

  return (
    <div className="tm-notes-list">
      {notes.map((note) => {
        const { day, month } = dateParts(note.created_at);
        return (
          <div key={note.id} className="tm-content-card tm-note-card">
            <div className="tm-note-date-col">
              <div className="tm-day">{day}</div>
              <div className="tm-month">{month}</div>
            </div>
            <div className="tm-note-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 4 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--tm-ink)' }}>
                    {note.title || 'Untitled note'}
                  </p>
                  <p className="tm-note-author" style={{ marginBottom: 8 }}>{formatDate(note.created_at)}</p>
                </div>
                <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                  <button onClick={() => onEdit(note)} className="tm-icon-btn" aria-label="Edit note" title="Edit note">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => onPrint(note)} className="tm-icon-btn" aria-label="Print note" title="Print note">
                    <Printer className="h-4 w-4" />
                  </button>
                  <button onClick={() => onDelete(note.id, patient.id)} className="tm-icon-btn danger" aria-label="Delete note" title="Delete note">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {note.content && (
                <p className="tm-note-text" style={{ marginBottom: note.file_url ? 10 : 0 }}>{note.content}</p>
              )}

              {note.file_url && (
                <div className="tm-attachment-row">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--tm-ink)', minWidth: 0 }}>
                    <Paperclip className="h-4 w-4" style={{ color: 'var(--tm-muted)', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note.file_name || 'Attachment'}</span>
                  </span>
                  <div style={{ display: 'flex', gap: 12, marginLeft: 'auto' }}>
                    <button onClick={() => onViewFile(note.file_url!, note.file_name)} className="tm-inline-link">
                      <Eye className="h-4 w-4" /> View
                    </button>
                    <button onClick={() => onDownloadFile(note.file_url!, note.file_name)} className="tm-inline-link">
                      <Download className="h-4 w-4" /> Download
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
