-- ============================================================================
-- home_visits table
-- Stores scheduled home visits (therapist travelling to a patient's house).
-- Run this in the Supabase SQL editor.
-- ============================================================================

create table if not exists public.home_visits (
    id            uuid primary key default gen_random_uuid(),
    patient_id    uuid not null references public.patients (id) on delete cascade,
    -- The therapist who scheduled the visit. Defaults to the authenticated user
    -- so the client never has to send it and can't spoof another therapist.
    therapist_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
    scheduled_at  timestamptz not null,
    notes         text,
    status        text not null default 'scheduled'
                  check (status in ('scheduled', 'completed', 'cancelled')),
    created_at    timestamptz not null default now()
);

-- Fast lookup of a patient's upcoming visits.
create index if not exists home_visits_patient_scheduled_idx
    on public.home_visits (patient_id, scheduled_at);

-- ----------------------------------------------------------------------------
-- Row Level Security: a therapist may only see / manage their own visits.
-- ----------------------------------------------------------------------------
alter table public.home_visits enable row level security;

create policy "therapist can read own visits"
    on public.home_visits for select
    using (therapist_id = auth.uid());

create policy "therapist can insert own visits"
    on public.home_visits for insert
    with check (therapist_id = auth.uid());

create policy "therapist can update own visits"
    on public.home_visits for update
    using (therapist_id = auth.uid())
    with check (therapist_id = auth.uid());

create policy "therapist can delete own visits"
    on public.home_visits for delete
    using (therapist_id = auth.uid());
