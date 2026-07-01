-- Clearway — core schema (Phase 1)
-- Run this against a Supabase project: SQL Editor > paste > Run,
-- or `supabase db push` if you're using the Supabase CLI.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- practices
-- ─────────────────────────────────────────────────────────────
create table if not exists practices (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  npi text,
  specialty text,
  primary_payers text[] not null default '{}',
  staff_count int,
  plan text not null default 'pilot' check (plan in ('pilot', 'practice', 'multi_site')),
  billing_status text not null default 'active' check (billing_status in ('active', 'grace_period', 'suspended')),
  letters_included int not null default 10,
  letters_used_this_period int not null default 0,
  billing_period_start date not null default date_trunc('month', now()),
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- profiles — one row per auth.users, links a user to a practice + role
-- ─────────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  practice_id uuid references practices (id) on delete set null,
  full_name text,
  role text not null default 'clinic_user' check (role in ('clinic_user', 'clinic_admin', 'super_admin')),
  created_at timestamptz not null default now()
);

-- auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- pa_requests
-- ─────────────────────────────────────────────────────────────
create table if not exists pa_requests (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices (id) on delete cascade,
  created_by uuid not null references profiles (id),
  patient_reference text not null,
  procedure_type text not null,
  payer text not null,
  icd10_codes text[] not null default '{}',
  symptom_duration text,
  case_fields jsonb not null default '{}'::jsonb,
  red_flags text[] not null default '{}',
  intended_use text,
  ordering_physician_name text not null,
  ordering_physician_credentials text,
  status text not null default 'draft' check (status in ('draft', 'reviewed', 'submitted', 'approved', 'denied')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pa_requests_practice_idx on pa_requests (practice_id, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- letters — generated drafts, one active letter per request (+ history via version)
-- ─────────────────────────────────────────────────────────────
create table if not exists letters (
  id uuid primary key default gen_random_uuid(),
  pa_request_id uuid not null references pa_requests (id) on delete cascade,
  content text not null,
  version int not null default 1,
  model text,
  approved_at timestamptz,
  approved_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create index if not exists letters_request_idx on letters (pa_request_id, version desc);

-- ─────────────────────────────────────────────────────────────
-- access log — required for HIPAA-style audit trail later; minimal now
-- ─────────────────────────────────────────────────────────────
create table if not exists access_log (
  id bigint generated always as identity primary key,
  user_id uuid references profiles (id),
  action text not null,
  resource_type text not null,
  resource_id uuid,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────
alter table practices enable row level security;
alter table profiles enable row level security;
alter table pa_requests enable row level security;
alter table letters enable row level security;
alter table access_log enable row level security;

create or replace function public.current_practice_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select practice_id from profiles where id = auth.uid();
$$;

create or replace function public.current_role()
returns text
language sql stable security definer set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

-- profiles: a user can see/update their own row and everyone in their practice
create policy "profiles_select_own_practice" on profiles
  for select using (
    id = auth.uid()
    or practice_id = public.current_practice_id()
    or public.current_role() = 'super_admin'
  );

create policy "profiles_update_own" on profiles
  for update using (id = auth.uid());

-- practices: members can read their own practice; clinic_admin can update it
create policy "practices_select_member" on practices
  for select using (
    id = public.current_practice_id() or public.current_role() = 'super_admin'
  );

create policy "practices_update_admin" on practices
  for update using (
    id = public.current_practice_id() and public.current_role() in ('clinic_admin', 'super_admin')
  );

create policy "practices_insert_self" on practices
  for insert with check (true);

-- pa_requests: scoped to practice
create policy "pa_requests_select_practice" on pa_requests
  for select using (
    practice_id = public.current_practice_id() or public.current_role() = 'super_admin'
  );

create policy "pa_requests_insert_practice" on pa_requests
  for insert with check (practice_id = public.current_practice_id());

create policy "pa_requests_update_practice" on pa_requests
  for update using (practice_id = public.current_practice_id());

-- letters: scoped via parent request's practice
create policy "letters_select_practice" on letters
  for select using (
    exists (
      select 1 from pa_requests r
      where r.id = letters.pa_request_id
      and (r.practice_id = public.current_practice_id() or public.current_role() = 'super_admin')
    )
  );

create policy "letters_insert_practice" on letters
  for insert with check (
    exists (
      select 1 from pa_requests r
      where r.id = letters.pa_request_id
      and r.practice_id = public.current_practice_id()
    )
  );

create policy "letters_update_practice" on letters
  for update using (
    exists (
      select 1 from pa_requests r
      where r.id = letters.pa_request_id
      and r.practice_id = public.current_practice_id()
    )
  );

-- access_log: insert-only from server, readable by super_admin
create policy "access_log_insert_any" on access_log
  for insert with check (true);

create policy "access_log_select_admin" on access_log
  for select using (public.current_role() = 'super_admin');
