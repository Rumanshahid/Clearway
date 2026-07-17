-- Lightweight patient-initiated PA and appeal requests. Deliberately a
-- separate, simpler pair of tables rather than reusing `pa_requests` /
-- `claim_denials` -- those are practice-scoped clinical tools (ICD-10/CPT
-- codes, payer criteria library, physician NPI, claim numbers a patient
-- typically doesn't have) built for staff, not something a patient_accounts
-- identity (which has no practice_id at all) can plausibly fill out or is
-- authorized to write into directly. These just capture what a patient
-- realistically has and notify the doctor to follow up.
create table patient_pa_requests (
  id uuid primary key default gen_random_uuid(),
  patient_account_id uuid not null references patient_accounts(id) on delete cascade,
  doctor_profile_id uuid not null references profiles(id) on delete cascade,
  procedure_description text not null,
  notes text,
  status text not null default 'submitted' check (status in ('submitted', 'in_review', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index patient_pa_requests_doctor_idx on patient_pa_requests(doctor_profile_id);

alter table patient_pa_requests enable row level security;
create policy "ppar_select_own" on patient_pa_requests
  for select using (patient_account_id = auth.uid() or doctor_profile_id = auth.uid());
create policy "ppar_insert_own" on patient_pa_requests
  for insert with check (patient_account_id = auth.uid());

create table patient_appeal_requests (
  id uuid primary key default gen_random_uuid(),
  patient_account_id uuid not null references patient_accounts(id) on delete cascade,
  doctor_profile_id uuid not null references profiles(id) on delete cascade,
  claim_number text,
  date_of_service date,
  denial_reason text not null,
  notes text,
  status text not null default 'submitted' check (status in ('submitted', 'in_review', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index patient_appeal_requests_doctor_idx on patient_appeal_requests(doctor_profile_id);

alter table patient_appeal_requests enable row level security;
create policy "paar_select_own" on patient_appeal_requests
  for select using (patient_account_id = auth.uid() or doctor_profile_id = auth.uid());
create policy "paar_insert_own" on patient_appeal_requests
  for insert with check (patient_account_id = auth.uid());
