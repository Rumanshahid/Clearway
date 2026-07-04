-- Patient roster, so staff stop re-typing the same patient's identity and
-- insurance details on every new request (same reasoning as physicians in
-- 0014). Deliberately trims the full ~94-field spec down to what actually
-- feeds a letter or payer routing decision — everything else (FHIR consent,
-- employer info, facility/place-of-service, insurance card images) was
-- judged out of scope and left out rather than collected and unused.

create table patients (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  patient_ref_id text not null,
  status text not null default 'active',

  -- Identity
  first_name text not null,
  middle_name text,
  last_name text not null,
  dob date not null,
  gender text not null,
  ssn_last4 text,
  preferred_language text,

  -- Contact
  address text,
  city text,
  state text,
  zip text,
  phone text,
  mobile_phone text,
  email text,
  preferred_contact_method text,
  best_time_to_call text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,

  -- Primary insurance
  insurance_company text,
  plan_type text,
  state_of_plan text,
  member_id text,
  group_number text,
  plan_name text,
  effective_date date,
  coverage_end_date date,
  insurance_phone text,
  insurance_pa_fax text,

  -- Secondary insurance
  has_secondary_insurance boolean not null default false,
  secondary_insurance_company text,
  secondary_plan_type text,
  secondary_member_id text,
  secondary_group_number text,
  cob_order text,

  -- Clinical & usual physician
  usual_physician_id uuid references physicians(id) on delete set null,
  primary_diagnosis_icd10 text,
  primary_diagnosis_description text,
  known_drug_allergies text,
  current_medications text,

  -- Consent
  consent_obtained boolean not null default false,
  consent_date date,
  consent_method text,

  -- Practice-internal notes
  coordinator_notes text,
  preferred_letter_author_mode text,
  preferred_submission_method text,
  special_handling_flags text[] not null default '{}',
  internal_tags text[] not null default '{}',

  created_at timestamptz not null default now(),

  unique (practice_id, member_id)
);

create index patients_practice_id_idx on patients(practice_id);

-- Auto-generates "PT-00001"-style IDs per practice, matching the format
-- staff already recognize from patient_reference on pa_requests.
create or replace function public.generate_patient_ref_id()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  next_num int;
begin
  if new.patient_ref_id is null or new.patient_ref_id = '' then
    select coalesce(max(substring(patient_ref_id from 'PT-(\d+)')::int), 0) + 1
      into next_num
      from patients
      where practice_id = new.practice_id;
    new.patient_ref_id := 'PT-' || lpad(next_num::text, 5, '0');
  end if;
  return new;
end;
$$;

create trigger patients_generate_ref_id
  before insert on patients
  for each row
  execute function public.generate_patient_ref_id();

alter table patients enable row level security;

create policy "patients_select_practice" on patients
  for select using (
    practice_id = public.current_practice_id() or public.current_role() = 'super_admin'
  );

create policy "patients_insert_practice" on patients
  for insert with check (practice_id = public.current_practice_id());

create policy "patients_update_practice" on patients
  for update using (practice_id = public.current_practice_id());

create policy "patients_delete_practice" on patients
  for delete using (practice_id = public.current_practice_id());

-- Links a request back to a saved patient (nullable — a request can still
-- be filed with only the inline patient_full_name/dob/etc. fields and no
-- saved patient record, exactly as before this migration).
alter table pa_requests add column if not exists patient_id uuid references patients(id) on delete set null;
