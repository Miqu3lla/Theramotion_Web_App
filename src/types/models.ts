export interface HomeVisit {
    id: string
    patient_id: string
    scheduled_at: string
    notes: string | null
    status: 'scheduled' | 'completed' | 'cancelled'
}
