-- Patient self-signup accounts. Deliberately NOT scoped to a practice_id --
-- this is a single cross-practice identity a patient owns for life, shared
-- with whichever practice's front desk they choose to give their Ref ID to
-- (the actual sharing/linking flow is a later phase; this migration only
-- lays the identity + self-entered profile foundation).
--
-- handle_new_user() (0001_init.sql) auto-creates a `profiles` row for every
-- auth.users insert -- that's correct for staff signups but wrong for a
-- patient (who has no practice, no role, no allowed_sections). Rather than
-- leave an orphaned profiles row behind, the trigger is updated to skip
-- profiles creation when the signup carries account_type: 'patient' in its
-- auth metadata (set by the patient sign-up form). Every existing signup
-- path (plain staff signup, invite links, admin-created users) has no such
-- metadata and is completely unaffected.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if coalesce(new.raw_user_meta_data ->> 'account_type', 'staff') = 'patient' then
    return new;
  end if;
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create table patient_accounts (
  id uuid primary key references auth.users(id) on delete cascade,
  patient_ref_id text not null unique,
  first_name text not null,
  last_name text not null,
  dob date not null,
  mobile_phone text not null,
  email text not null,
  consent_share_info boolean not null default false,
  consent_terms_privacy boolean not null default false,
  consent_notifications boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Global (not per-practice) sequence -- deliberately a different prefix
-- (PTA- rather than the existing per-practice PT- used by the `patients`
-- table's own patient_ref_id) so staff never confuse "a practice's own
-- patient record" with "this person's own cross-practice account".
create sequence if not exists patient_account_ref_seq start 1;

create or replace function public.generate_patient_account_ref_id()
returns trigger
language plpgsql
as $$
begin
  if new.patient_ref_id is null or new.patient_ref_id = '' then
    new.patient_ref_id := 'PTA-' || lpad(nextval('patient_account_ref_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

create trigger set_patient_account_ref_id
  before insert on patient_accounts
  for each row execute procedure public.generate_patient_account_ref_id();

alter table patient_accounts enable row level security;

-- No insert policy: the signup server action creates this row with the
-- service-role (admin) client, the same pattern onboarding already uses for
-- creating a practices row -- a patient's own session should never be able
-- to insert its own account row directly (that would let anyone forge an
-- arbitrary id/ref combination).
create policy "patient_accounts_select_own" on patient_accounts
  for select using (id = auth.uid());
create policy "patient_accounts_update_own" on patient_accounts
  for update using (id = auth.uid());

-- Self-entered intake/profile data -- the same broad shape of information
-- staff collect about a patient today (address, insurance, emergency
-- contact, allergies/medications), but owned and editable by the patient
-- themselves rather than by practice staff. Kept as its own table (1:1 with
-- patient_accounts) rather than extra columns on patient_accounts so the
-- core identity/signup fields and the optional profile-completion fields
-- stay clearly separated.
create table patient_profiles (
  patient_account_id uuid primary key references patient_accounts(id) on delete cascade,
  address text,
  city text,
  state text,
  zip text,
  preferred_language text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,
  insurance_company text,
  plan_type text,
  member_id text,
  group_number text,
  plan_name text,
  has_secondary_insurance boolean not null default false,
  secondary_insurance_company text,
  secondary_member_id text,
  secondary_group_number text,
  known_drug_allergies text,
  current_medications text,
  preferred_contact_method text,
  updated_at timestamptz not null default now()
);

alter table patient_profiles enable row level security;

create policy "patient_profiles_select_own" on patient_profiles
  for select using (patient_account_id = auth.uid());
create policy "patient_profiles_insert_own" on patient_profiles
  for insert with check (patient_account_id = auth.uid());
create policy "patient_profiles_update_own" on patient_profiles
  for update using (patient_account_id = auth.uid());
