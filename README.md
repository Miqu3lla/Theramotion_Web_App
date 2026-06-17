# Theramotion Web App

**Theramotion** is the clinician-facing admin dashboard for a stroke‑rehabilitation
platform. It is the web companion to the patient mobile app: while patients perform
guided exercises on their device, therapists use this dashboard to monitor each
patient's progress and keep clinical records.

The app is built for **therapists / admins** — every feature assumes a logged-in
clinician managing a roster of patients. Access is restricted at the database level
so only registered therapists can read or write any data.

## What it does

- **Patient dashboard** — at-a-glance grid of patients with their affected area,
  last session, and next appointment.
- **Patient directory & search** — browse the full roster and filter by name, with
  pagination and a debounced search.
- **Live activity** — patients currently active in a rehab session are shown with a
  real-time **Active** badge (via Supabase Presence).
- **Performance insight** — open a patient to see their recent exercises and latest
  form scores, colour-coded by performance.
- **Clinical notes** — behind each patient's **Log Note** button, therapists can:
  - Write notes (title + body) tied to the patient.
  - Attach files by picker or drag‑and‑drop (PDF, Word, Excel, PowerPoint, text,
    images — up to 25 MB; videos and other types are rejected).
  - View attachments in-app (images, PDFs, and text render directly; Office docs
    preview via Microsoft's viewer behind an explicit consent step).
  - Download, edit, or delete notes, and print an individual note.

## Tech stack

- **React 19 + Vite + TypeScript**
- **Tailwind CSS** (Material-style design tokens)
- **Zustand** for state management
- **React Router** for navigation
- **Supabase** for auth, Postgres (with Row Level Security), and file Storage
- **Lucide React** for icons

## Project structure

```
src/
  views/          Top-level pages (Login, Homepage/dashboard, Notes)
  components/     UI building blocks
    Homepage/     Navbar, PatientCard
    Login/        Login form and layout
    Modals/       Patient directory, performance, notes, file preview
    ui/           Shared primitives (e.g. Pagination)
  store/          Zustand stores (auth, patients, notes)
  hooks/          Reusable hooks (e.g. patient search)
  utils/          Supabase client and helpers
```

## Getting started

### 1. Prerequisites

- Node.js 18+
- A Supabase project (this app expects the rehab platform's existing schema:
  `patients`, `therapists`, `clinical_notes`, `form_predictions`,
  `recommendation_logs`, and a private `clinical-notes` Storage bucket).

### 2. Environment variables

Create a `.env` file in the project root:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Find these in your Supabase dashboard under **Project Settings → API**. The `.env`
file is git-ignored and must never be committed.

### 3. Install and run

```bash
npm install
npm run dev
```

The dev server prints a local URL (default http://localhost:5173).

## Scripts

- `npm run dev` — start the development server
- `npm run build` — type-check and create a production build
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint

## Access & security

Sign-in uses Supabase Auth (email + password). All patient data, clinical notes,
and attachment files are protected by Row Level Security policies that require the
signed-in user to be a registered **therapist** — non-therapist accounts cannot read
or write any of it, even though they may authenticate against the same backend.
