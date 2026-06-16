-- ============================================================================
-- Clinical Notes feature setup
-- Run this in the Supabase SQL editor (DDL requires elevated privileges; the
-- app's anon key cannot run it).
--
-- Extends the existing public.clinical_notes table with note content + an
-- optional file attachment, defaults the author to the current therapist, and
-- adds Row Level Security plus a private Storage bucket for uploads.
--
-- All statements are idempotent (IF NOT EXISTS / drop-then-create) so this can
-- be re-run safely.
-- ============================================================================

-- 1. Note content + attachment columns -------------------------------------
alter table public.clinical_notes
  add column if not exists title      text,
  add column if not exists content    text,
  add column if not exists file_url   text,   -- storage path of the uploaded file
  add column if not exists file_name  text,   -- original filename for display
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- Author defaults to the signed-in therapist (therapists.id = auth.users.id).
alter table public.clinical_notes
  alter column therapist_id set default auth.uid();

-- Speeds up "all notes for this patient, newest first".
create index if not exists clinical_notes_patient_id_created_at_idx
  on public.clinical_notes (patient_id, created_at desc);

-- 2. Row Level Security -----------------------------------------------------
alter table public.clinical_notes enable row level security;

-- Any authenticated therapist/admin can read every note (admin views them all).
drop policy if exists "Authenticated can view clinical notes" on public.clinical_notes;
create policy "Authenticated can view clinical notes"
  on public.clinical_notes
  for select
  to authenticated
  using (true);

-- A therapist may only create notes authored as themselves.
drop policy if exists "Therapists insert own clinical notes" on public.clinical_notes;
create policy "Therapists insert own clinical notes"
  on public.clinical_notes
  for insert
  to authenticated
  with check (therapist_id = auth.uid());

-- A therapist may only edit their own notes.
drop policy if exists "Therapists update own clinical notes" on public.clinical_notes;
create policy "Therapists update own clinical notes"
  on public.clinical_notes
  for update
  to authenticated
  using (therapist_id = auth.uid())
  with check (therapist_id = auth.uid());

-- A therapist may only delete their own notes.
drop policy if exists "Therapists delete own clinical notes" on public.clinical_notes;
create policy "Therapists delete own clinical notes"
  on public.clinical_notes
  for delete
  to authenticated
  using (therapist_id = auth.uid());

-- 3. Storage bucket for uploaded note files ---------------------------------
-- Private bucket; the app reads files via signed URLs. Limited to 25MB and to
-- the document/image types the app supports (videos and anything else are
-- rejected at upload time). ON CONFLICT updates these limits if the bucket
-- already exists.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'clinical-notes',
  'clinical-notes',
  false,
  26214400, -- 25 MB in bytes
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/vnd.oasis.opendocument.presentation',
    'application/rtf',
    'application/json',
    'text/plain',
    'text/csv',
    'text/markdown',
    'text/rtf',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/svg+xml',
    'image/avif'
  ]
)
on conflict (id) do update
  set file_size_limit   = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Authenticated therapists can read uploaded note files.
drop policy if exists "Authenticated read clinical note files" on storage.objects;
create policy "Authenticated read clinical note files"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'clinical-notes');

-- Authenticated therapists can upload note files.
drop policy if exists "Authenticated upload clinical note files" on storage.objects;
create policy "Authenticated upload clinical note files"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'clinical-notes');

-- Authenticated therapists can delete note files.
drop policy if exists "Authenticated delete clinical note files" on storage.objects;
create policy "Authenticated delete clinical note files"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'clinical-notes');
