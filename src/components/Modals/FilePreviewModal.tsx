import { useState } from 'react';
import { X, Download, FileQuestion, ShieldAlert } from 'lucide-react';

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
  // Office preview forwards the file to Microsoft's hosted viewer, so it's gated
  // behind explicit consent. Tracking the consented URL (rather than a boolean
  // reset in an effect) means consent auto-resets when a different file opens.
  const [consentedUrl, setConsentedUrl] = useState<string | null>(null);

  if (!file) return null;

  const officeConsented = consentedUrl === file.url;

  return (
    <div
      className="tm-modal-overlay print:hidden"
      style={{ zIndex: 70, background: 'rgba(28,28,26,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="tm-modal-panel" style={{ maxWidth: 720, maxHeight: '90vh' }}>

        {/* Header */}
        <div className="tm-modal-header" style={{ padding: '16px 20px' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <button onClick={onDownload} className="tm-inline-link" style={{ padding: '7px 12px', borderRadius: 10 }}>
              <Download className="h-4 w-4" /> Download
            </button>
            <button onClick={onClose} className="tm-modal-close" aria-label="Close preview">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', background: 'var(--tm-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {file.kind === 'image' ? (
            <img src={file.url} alt={file.name} className="max-w-full max-h-[78vh] object-contain" />
          ) : file.kind === 'pdf' ? (
            <iframe src={file.url} title={file.name} className="w-full h-[78vh] bg-white" />
          ) : file.kind === 'office' ? (
            officeConsented ? (
              // Word/Excel/PowerPoint rendered by Microsoft's hosted Office viewer.
              <iframe
                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.url)}`}
                title={file.name}
                className="w-full h-[78vh] bg-white"
              />
            ) : (
              // Consent gate: previewing this file sends it off-platform to a
              // third party, so default to download and require an explicit opt-in.
              <div style={{ textAlign: 'center', padding: 48, maxWidth: 420, margin: '0 auto' }}>
                <ShieldAlert className="h-11 w-11 mx-auto" style={{ color: 'var(--tm-muted)', marginBottom: 14, opacity: 0.8 }} />
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--tm-ink)', marginBottom: 6 }}>Preview uses an external service</p>
                <p style={{ fontSize: 13, color: 'var(--tm-muted)', marginBottom: 22, lineHeight: 1.5 }}>
                  To preview Office documents in the browser, this file is sent to
                  Microsoft's online viewer (view.officeapps.live.com). For sensitive
                  data, download it instead to open locally.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button onClick={onDownload} className="tm-btn primary" style={{ flex: 'none', padding: '10px 20px' }}>
                    <Download className="h-4 w-4" style={{ display: 'inline', marginRight: 6 }} /> Download file
                  </button>
                  <button onClick={() => setConsentedUrl(file.url)} className="tm-btn" style={{ flex: 'none', padding: '10px 20px' }}>
                    Preview with Microsoft viewer
                  </button>
                </div>
              </div>
            )
          ) : file.kind === 'text' ? (
            // Rendered by us on a white panel so it isn't subject to the
            // browser's dark default styling for raw text files.
            <pre className="w-full h-[78vh] overflow-auto bg-white text-gray-900 p-6 text-sm font-mono whitespace-pre-wrap break-words">
              {file.text}
            </pre>
          ) : (
            <div className="tm-empty-state" style={{ padding: 48 }}>
              <FileQuestion className="h-11 w-11 mx-auto" />
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--tm-ink)', marginBottom: 6 }}>This file type can't be previewed here.</p>
              <p style={{ fontSize: 13, marginBottom: 20 }}>Download it to open with the right app.</p>
              <button onClick={onDownload} className="tm-btn primary" style={{ flex: 'none', padding: '10px 20px', margin: '0 auto', display: 'inline-flex' }}>
                <Download className="h-4 w-4" style={{ display: 'inline', marginRight: 6 }} /> Download file
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
