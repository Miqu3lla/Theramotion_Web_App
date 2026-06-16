import { create } from 'zustand'
import { supabase } from '../utils/db'

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
    isLoading: boolean
    isSaving: boolean
    error: string | null
    // keyed by patient id so each patient's notes are cached separately
    notesByPatient: Record<string, ClinicalNote[]>
    fetchNotes: (patientId: string) => Promise<void>
    createNote: (args: CreateNoteArgs) => Promise<boolean>
    updateNote: (args: UpdateNoteArgs) => Promise<boolean>
    deleteNote: (noteId: string, patientId: string) => Promise<void>
    // Files live in a private bucket, so the UI needs a short-lived signed URL.
    // Pass a filename to `download` to force a browser download of that name
    // (sets Content-Disposition: attachment) instead of viewing inline.
    getFileUrl: (path: string, download?: string) => Promise<string | null>
}

const BUCKET = 'clinical-notes'

const useNoteStore = create<NoteState>((set) => ({
    isLoading: false,
    isSaving: false,
    error: null,
    notesByPatient: {},

    // Fetch every note for one patient, newest first.
    fetchNotes: async (patientId: string) => {
        set({ isLoading: true, error: null })

        try {
            const { data, error } = await supabase
                .from('clinical_notes')
                .select('id, patient_id, therapist_id, title, content, file_url, file_name, created_at, updated_at')
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false })

            if (error) throw error

            // Merge into the cache without clobbering other patients' notes.
            set((state) => ({
                notesByPatient: {
                    ...state.notesByPatient,
                    [patientId]: data ?? [],
                },
                isLoading: false,
            }))

        } catch (error: any) {
            console.error('Error fetching clinical notes:', error)
            set({ isLoading: false, error: error.message })
        }
    },

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
                    .upload(path, file)

                if (uploadError) throw uploadError

                filePath = path
                fileName = file.name
            }

            const { data, error } = await supabase
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

            if (error) throw error

            // Prepend the new note to that patient's cached list.
            set((state) => ({
                notesByPatient: {
                    ...state.notesByPatient,
                    [patientId]: [data, ...(state.notesByPatient[patientId] ?? [])],
                },
                isSaving: false,
            }))

            return true

        } catch (error: any) {
            console.error('Error creating clinical note:', error)
            set({ isSaving: false, error: error.message })
            return false
        }
    },

    // Update a note's text and, optionally, swap or remove its attachment.
    updateNote: async ({ noteId, patientId, title, content, file, removeFile }: UpdateNoteArgs) => {
        set({ isSaving: true, error: null })

        try {
            const existing = useNoteStore.getState().notesByPatient[patientId] ?? []
            const target = existing.find((n) => n.id === noteId)
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
                    .upload(path, file)

                if (uploadError) throw uploadError

                filePath = path
                fileName = file.name
            } else if (removeFile) {
                filePath = null
                fileName = null
            }

            const { data, error } = await supabase
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

            if (error) throw error

            // Once the row is updated, clean up the now-orphaned old file. Done
            // last (and best-effort) so a storage hiccup can't lose the edit.
            if (oldPath && oldPath !== filePath) {
                await supabase.storage.from(BUCKET).remove([oldPath])
            }

            set((state) => ({
                notesByPatient: {
                    ...state.notesByPatient,
                    [patientId]: (state.notesByPatient[patientId] ?? []).map((n) =>
                        n.id === noteId ? data : n
                    ),
                },
                isSaving: false,
            }))

            return true

        } catch (error: any) {
            console.error('Error updating clinical note:', error)
            set({ isSaving: false, error: error.message })
            return false
        }
    },

    // Delete a note (and its attached file, if any) then drop it from the cache.
    deleteNote: async (noteId: string, patientId: string) => {
        set({ error: null })

        try {
            const existing = useNoteStore.getState().notesByPatient[patientId] ?? []
            const target = existing.find((n) => n.id === noteId)

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

            set((state) => ({
                notesByPatient: {
                    ...state.notesByPatient,
                    [patientId]: existing.filter((n) => n.id !== noteId),
                },
            }))

        } catch (error: any) {
            console.error('Error deleting clinical note:', error)
            set({ error: error.message })
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

        } catch (error: any) {
            console.error('Error creating signed URL:', error)
            return null
        }
    },
}))

export default useNoteStore
