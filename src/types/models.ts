export interface HomeVisit {
    id: string
    patient_id: string
    scheduled_at: string
    notes: string | null
    status: 'scheduled' | 'completed' | 'cancelled'
}

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

