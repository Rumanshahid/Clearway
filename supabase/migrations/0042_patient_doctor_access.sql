-- Lets a patient control which doctors can see their self-entered
-- patient_profiles data (insurance, allergies, emergency contact, etc).
-- Keyed on the doctor's own staff identity (profiles.id) rather than a
-- whole practice, since the ask is "allowed doctors" individually, not
-- "allowed practices". No FK linking a `patients` (practice EHR) row to a
-- `patient_accounts` row exists or is added here -- the doctor-side page
-- resolves the relationship at query time by matching email, so this table
-- only needs to know the two identities and the access state.
create table patient_doctor_access (
  patient_account_id uuid not null references patient_accounts(id) on delete cascade,
  doctor_profile_id uuid not null references profiles(id) on delete cascade,
  access_granted boolean not null default false,
  requested_at timestamptz,
  granted_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (patient_account_id, doctor_profile_id)
);

create index patient_doctor_access_doctor_idx on patient_doctor_access(doctor_profile_id);

alter table patient_doctor_access enable row level security;

create policy "pda_select_own" on patient_doctor_access
  for select using (patient_account_id = auth.uid() or doctor_profile_id = auth.uid());
create policy "pda_insert_own" on patient_doctor_access
  for insert with check (patient_account_id = auth.uid() or doctor_profile_id = auth.uid());
create policy "pda_update_patient_only" on patient_doctor_access
  for update using (patient_account_id = auth.uid());
create policy "pda_delete_patient_only" on patient_doctor_access
  for delete using (patient_account_id = auth.uid());
