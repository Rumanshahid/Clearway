-- Structured risk flags and improvement suggestions attached to a patient's
-- AI-drafted PA/appeal letter (see lib/patient-letters.ts) -- surfaced next
-- to the letter so the patient knows what might weaken the request before
-- they send it, since these letters are drafted from what a patient
-- realistically knows (no clinical codes, no payer criteria library).
alter table patient_pa_requests add column if not exists risk_flags jsonb not null default '[]'::jsonb;
alter table patient_pa_requests add column if not exists suggestions jsonb not null default '[]'::jsonb;
alter table patient_appeal_requests add column if not exists risk_flags jsonb not null default '[]'::jsonb;
alter table patient_appeal_requests add column if not exists suggestions jsonb not null default '[]'::jsonb;
