import { X, Download, FileQuestion } from 'lucide-react';

// What kind of in-browser preview a file supports, derived from its extension.
// 'office' covers Word/Excel/PowerPoint, shown via the Microsoft Office viewer.
export type PreviewKind = 'image' | 'pdf' | 'text' | 'office' | 'other';

export interface PreviewFile {
  url: string;        // signed, inline (non-download) URL
  name: string;       // original filename
  kind: PreviewKind;
  text?: string;      // fetched contents for text files (rendered by us, not the browser)
}

interface FilePreviewModalProps {
  file: PreviewFile | null;
  onClose: () => void;
  onDownload: () => void;
}

export default function FilePreviewModal({ file, onClose, onDownload }: FilePreviewModalProps) {
  if (!file) return null;

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 p-4 print:hidden"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface w-full max-w-3xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-xl">

        {/* Header */}
        <div className="p-4 border-b border-outline-variant flex justify-between items-center gap-3 bg-surface-container-lowest">
          <h3 className="text-body-lg font-semibold text-on-surface truncate">{file.name}</h3>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-body-sm font-semibold text-primary hover:bg-surface-container transition-colors"
            >
              <Download className="h-4 w-4" /> Download
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto bg-surface-container-low flex items-center justify-center">
          {file.kind === 'image' ? (
            <img src={file.url} alt={file.name} className="max-w-full max-h-[78vh] object-contain" />
          ) : file.kind === 'pdf' ? (
            <iframe src={file.url} title={file.name} className="w-full h-[78vh] bg-white" />
          ) : file.kind === 'office' ? (
            // Word/Excel/PowerPoint rendered by Microsoft's hosted Office viewer,
            // which fetches the (publicly reachable) signed URL and renders it.
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.url)}`}
              title={file.name}
              className="w-full h-[78vh] bg-white"
            />
          ) : file.kind === 'text' ? (
            // Rendered by us on a white panel so it isn't subject to the
            // browser's dark default styling for raw text files.
            <pre className="w-full h-[78vh] overflow-auto bg-white text-gray-900 p-6 text-sm font-mono whitespace-pre-wrap break-words">
              {file.text}
            </pre>
          ) : (
            <div className="text-center p-12">
              <FileQuestion className="h-12 w-12 mx-auto text-on-surface-variant mb-4 opacity-60" />
              <p className="text-body-md text-on-surface mb-1">This file type can't be previewed here.</p>
              <p className="text-body-sm text-on-surface-variant mb-5">Download it to open with the right app.</p>
              <button
                onClick={onDownload}
                className="inline-flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-lg font-label-md font-semibold hover:bg-primary-container hover:text-on-primary-container transition-colors"
              >
                <Download className="h-4 w-4" /> Download file
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
