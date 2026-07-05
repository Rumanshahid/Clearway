-- Team management: per-section staff permissions and an invite flow so a
-- practice's doctor/admin (clinic_admin) can add staff to their own practice
-- instead of every signup creating a brand-new practice.
--
-- Roles are unchanged — clinic_admin is the "Doctor / Admin" role (full
-- access, manages the team), clinic_user is "Staff" (restricted to the
-- dashboard sections listed in allowed_sections). Section keys:
-- 'requests' (PA dashboard), 'patients', 'appeals'. Admins ignore the list.

alter table profiles
  add column if not exists allowed_sections text[] not null default '{requests,patients,appeals}';

create table invites (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  email text not null,
  role text not null default 'clinic_user',
  allowed_sections text[] not null default '{requests,patients,appeals}',
  token text not null unique,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by uuid
);

create index invites_practice_id_idx on invites(practice_id);

alter table invites enable row level security;

-- Only the practice's admins manage invites. The invited person themselves
-- never reads this table through RLS — the /join flow looks the token up
-- with the service-role client, since the invitee isn't a practice member
-- yet by definition.
create policy "invites_select_practice_admin" on invites
  for select using (
    (practice_id = public.current_practice_id() and public.current_role() in ('clinic_admin', 'super_admin'))
    or public.current_role() = 'super_admin'
  );

create policy "invites_insert_practice_admin" on invites
  for insert with check (
    practice_id = public.current_practice_id() and public.current_role() in ('clinic_admin', 'super_admin')
  );

create policy "invites_delete_practice_admin" on invites
  for delete using (
    practice_id = public.current_practice_id() and public.current_role() in ('clinic_admin', 'super_admin')
  );
