-- Saved ordering physicians per practice, so staff aren't re-typing the
-- same physician's NPI/phone/fax on every new request. A request can still
-- enter a brand-new physician at any time; saving one for reuse is opt-in
-- per submission (see NewRequestForm's "Save this physician" checkbox).

create table physicians (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  name text not null,
  credentials text,
  npi text not null,
  direct_phone text,
  specialty text,
  fax text,
  created_at timestamptz not null default now(),
  unique (practice_id, npi)
);

alter table physicians enable row level security;

create policy "physicians_select_practice" on physicians
  for select using (
    practice_id = public.current_practice_id() or public.current_role() = 'super_admin'
  );

create policy "physicians_insert_practice" on physicians
  for insert with check (practice_id = public.current_practice_id());

create policy "physicians_update_practice" on physicians
  for update using (practice_id = public.current_practice_id());

create policy "physicians_delete_practice" on physicians
  for delete using (practice_id = public.current_practice_id());
