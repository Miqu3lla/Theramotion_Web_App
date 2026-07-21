import { PreviewKind } from '../FilePreviewModal';

// Attachment types the picker should surface: PDF, Word, Excel, PowerPoint,
// plain text/CSV/RTF, OpenDocument, and images. Extensions are the most reliable
// filter across browsers; image/* covers scanned photos of paper notes.
export const ACCEPTED_FILE_TYPES = [
  '.pdf',
  '.doc', '.docx',
  '.xls', '.xlsx',
  '.ppt', '.pptx',
  '.txt', '.csv', '.rtf',
  '.odt', '.ods', '.odp',
  'image/*',
].join(',');

export const MAX_FILE_SIZE_MB = 25;

// Decide how an attachment can be previewed in-app from its extension. Images
// render in an <img>; PDFs and plain-text formats render in an <iframe>;
// everything else (Word/Excel/etc.) falls back to a download prompt.
export function previewKindFor(name: string | null): PreviewKind {
  const ext = name?.split('.').pop()?.toLowerCase() ?? '';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'avif'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (['txt', 'csv', 'log', 'md', 'json'].includes(ext)) return 'text';
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return 'office';
  return 'other';
}

// Friendly absolute date+time for note timestamps.
export function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
