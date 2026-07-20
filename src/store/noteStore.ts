import { create } from 'zustand'
import { supabase } from '../utils/db'
import { queryClient } from '../lib/queryClient'

// One clinical note row. Mirrors the public.clinical_notes table after the
// columns added in supabase/clinical_notes_setup.sql.
export interface ClinicalNote {
    id: string
    patient_id: string
    therapist_id: string
    title: string | null
    content: string | null
    file_url: string | null   // storage path inside the 'clinical-notes' bucket
    file_name: string | null  // original filename, for display
    created_at: string
    updated_at: string
}

interface CreateNoteArgs {
    patientId: string
    title: string
    content: string
    file: File | null
}

interface UpdateNoteArgs {
    noteId: string
    patientId: string
    title: string
    content: string
    file: File | null      // a newly picked file that replaces the old attachment
    removeFile: boolean     // true when the existing attachment should be dropped
}

interface NoteState {
    isSaving: boolean
    error: string | null
    createNote: (args: CreateNoteArgs) => Promise<boolean>
    updateNote: (args: UpdateNoteArgs) => Promise<boolean>
    deleteNote: (noteId: string, patientId: string) => Promise<void>
    // Files live in a private bucket, so the UI needs a short-lived signed URL.
    // Pass a filename to `download` to force a browser download of that name
    // (sets Content-Disposition: attachment) instead of viewing inline.
    getFileUrl: (path: string, download?: string) => Promise<string | null>
}

const BUCKET = 'clinical-notes'

// Browsers leave File.type empty for some text formats (.md, .log, .csv...),
// which would upload as application/octet-stream and be rejected by the bucket's
// allowed_mime_types. Map by extension so the upload sends a type the bucket
// accepts. Must stay in sync with allowed_mime_types in clinical_notes_setup.sql.
const MIME_BY_EXT: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    odt: 'application/vnd.oasis.opendocument.text',
    ods: 'application/vnd.oasis.opendocument.spreadsheet',
    odp: 'application/vnd.oasis.opendocument.presentation',
    rtf: 'application/rtf',
    json: 'application/json',
    txt: 'text/plain',
    log: 'text/plain',
    csv: 'text/csv',
    md: 'text/markdown',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
    svg: 'image/svg+xml',
    avif: 'image/avif',
}

// Prefer the browser-reported type; fall back to the extension map.
function contentTypeFor(file: File): string {
    if (file.type) return file.type
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    return MIME_BY_EXT[ext] ?? 'application/octet-stream'
}

// Safely extract a message from an unknown caught value (catch clauses are
// typed `unknown`), so we never assume `.message` exists on a non-Error.
function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message
    if (typeof error === 'string') return error
    return 'An unexpected error occurred.'
}

const useNoteStore = create<NoteState>((set) => ({
    isSaving: false,
    error: null,

    // Create a note: optionally upload a file to Storage first, then insert the
    // row. Returns true on success so the modal can reset its form.
    createNote: async ({ patientId, title, content, file }: CreateNoteArgs) => {
        set({ isSaving: true, error: null })

        try {
            // therapist_id also defaults to auth.uid() in the DB, but we set it
            // explicitly so the RLS insert check is satisfied deterministically.
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('You must be signed in to add a note.')

            let filePath: string | null = null
            let fileName: string | null = null

            if (file) {
                // Namespaced by patient + timestamp to avoid collisions.
                const safeName = file.name.replace(/[^\w.-]+/g, '_')
                const path = `${patientId}/${Date.now()}-${safeName}`

                const { error: uploadError } = await supabase
                    .storage
                    .from(BUCKET)
                    .upload(path, file, { contentType: contentTypeFor(file) })

                if (uploadError) throw uploadError

                filePath = path
                fileName = file.name
            }

            const { error } = await supabase
                .from('clinical_notes')
                .insert({
                    patient_id: patientId,
                    therapist_id: user.id,
                    title: title.trim() || null,
                    content: content.trim() || null,
                    file_url: filePath,
                    file_name: fileName,
                })
                .select('id, patient_id, therapist_id, title, content, file_url, file_name, created_at, updated_at')
                .single()

            if (error) {
                // Roll back the just-uploaded file so a failed insert doesn't
                // leave an orphaned object in Storage.
                if (filePath) await supabase.storage.from(BUCKET).remove([filePath])
                throw error
            }

            // Invalidate the TanStack Query cache so the UI refetches the updated list.
            queryClient.invalidateQueries({ queryKey: ['clinical-notes', patientId] })
            
            set({ isSaving: false })

            return true

        } catch (error: unknown) {
            console.error('Error creating clinical note:', error)
            set({ isSaving: false, error: getErrorMessage(error) })
            return false
        }
    },

    // Update a note's text and, optionally, swap or remove its attachment.
    updateNote: async ({ noteId, patientId, title, content, file, removeFile }: UpdateNoteArgs) => {
        set({ isSaving: true, error: null })

        try {
            // We just need the old file path. We can query the database for the current record.
            const { data: target, error: fetchError } = await supabase
                .from('clinical_notes')
                .select('file_url, file_name')
                .eq('id', noteId)
                .single()

            if (fetchError) throw fetchError

            const oldPath = target?.file_url ?? null

            // Start from the current attachment; adjust only if it changes.
            let filePath: string | null = oldPath
            let fileName: string | null = target?.file_name ?? null

            if (file) {
                // Replace: upload the new file, then point the row at it.
                const safeName = file.name.replace(/[^\w.-]+/g, '_')
                const path = `${patientId}/${Date.now()}-${safeName}`

                const { error: uploadError } = await supabase
                    .storage
                    .from(BUCKET)
                    .upload(path, file, { contentType: contentTypeFor(file) })

                if (uploadError) throw uploadError

                filePath = path
                fileName = file.name
            } else if (removeFile) {
                filePath = null
                fileName = null
            }

            const { error } = await supabase
                .from('clinical_notes')
                .update({
                    title: title.trim() || null,
                    content: content.trim() || null,
                    file_url: filePath,
                    file_name: fileName,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', noteId)
                .select('id, patient_id, therapist_id, title, content, file_url, file_name, created_at, updated_at')
                .single()

            if (error) {
                // Roll back a newly uploaded replacement so a failed update
                // doesn't orphan it; the old file is intentionally kept.
                if (file && filePath && filePath !== oldPath) {
                    await supabase.storage.from(BUCKET).remove([filePath])
                }
                throw error
            }

            // Once the row is updated, clean up the now-orphaned old file. Done
            // last (and best-effort) so a storage hiccup can't lose the edit.
            if (oldPath && oldPath !== filePath) {
                await supabase.storage.from(BUCKET).remove([oldPath])
            }

            queryClient.invalidateQueries({ queryKey: ['clinical-notes', patientId] })
            set({ isSaving: false })

            return true

        } catch (error: unknown) {
            console.error('Error updating clinical note:', error)
            set({ isSaving: false, error: getErrorMessage(error) })
            return false
        }
    },

    // Delete a note (and its attached file, if any) then drop it from the cache.
    deleteNote: async (noteId: string, patientId: string) => {
        set({ error: null })

        try {
            // Fetch target to get the file url
            const { data: target, error: fetchError } = await supabase
                .from('clinical_notes')
                .select('file_url')
                .eq('id', noteId)
                .single()

            if (fetchError && fetchError.code !== 'PGRST116') throw fetchError

            const { error } = await supabase
                .from('clinical_notes')
                .delete()
                .eq('id', noteId)

            if (error) throw error

            // Best-effort cleanup of the storage object; ignore its error so a
            // missing file never blocks removing the row from the UI.
            if (target?.file_url) {
                await supabase.storage.from(BUCKET).remove([target.file_url])
            }

            queryClient.invalidateQueries({ queryKey: ['clinical-notes', patientId] })

        } catch (error: unknown) {
            console.error('Error deleting clinical note:', error)
            set({ error: getErrorMessage(error) })
        }
    },

    // Short-lived signed URL for viewing/downloading a private attachment.
    getFileUrl: async (path: string, download?: string) => {
        try {
            const { data, error } = await supabase
                .storage
                .from(BUCKET)
                // `download: <name>` forces an attachment download with that
                // filename; omit it to view the file inline in the browser.
                .createSignedUrl(path, 60 * 5, download ? { download } : undefined) // valid for 5 minutes

            if (error) throw error
            return data?.signedUrl ?? null

        } catch (error: unknown) {
            console.error('Error creating signed URL:', error)
            return null
        }
    },
}))

export default useNoteStore
