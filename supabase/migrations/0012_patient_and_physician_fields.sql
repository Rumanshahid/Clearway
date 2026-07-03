-- Adds real patient identity fields (needed for actual payer submission — a
-- letter can't be filed with a de-identified reference alone) plus the
-- ordering-physician and plan fields payers commonly require alongside them.
-- patient_reference stays as-is and keeps being the identifier used
-- everywhere in the app's own UI/URLs/notifications; these new columns are
-- only surfaced inside the generated letter body itself.

alter table pa_requests
  add column if not exists patient_full_name text,
  add column if not exists patient_dob date,
  add column if not exists patient_address text,
  add column if not exists patient_city_state_zip text,
  add column if not exists patient_phone text,
  add column if not exists insurance_group_number text,
  add column if not exists ordering_physician_npi text,
  add column if not exists ordering_physician_direct_phone text,
  add column if not exists ordering_physician_specialty text,
  add column if not exists ordering_physician_fax text,
  add column if not exists plan_type text;
