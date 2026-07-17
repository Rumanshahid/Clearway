-- AI-drafted, patient-voice letter attached to a patient-initiated PA or
-- appeal request -- see lib/patientLetters.ts. Nullable: generation is
-- best-effort and must never block submission.
alter table patient_pa_requests add column if not exists letter_content text;
alter table patient_appeal_requests add column if not exists letter_content text;
