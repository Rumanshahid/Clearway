-- Clearway — Phase 2 (Paddle billing) + Phase 3 (admin panel) schema additions.
-- Run after 0001_init.sql.

-- ─────────────────────────────────────────────────────────────
-- billing: Paddle identifiers on practices + an append-only event log
-- ─────────────────────────────────────────────────────────────
alter table practices add column if not exists paddle_customer_id text;
alter table practices add column if not exists paddle_subscription_id text;

create table if not exists billing_events (
  id bigint generated always as identity primary key,
  practice_id uuid references practices (id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists billing_events_practice_idx on billing_events (practice_id, occurred_at desc);

alter table billing_events enable row level security;

create policy "billing_events_insert_any" on billing_events
  for insert with check (true);

create policy "billing_events_select_scoped" on billing_events
  for select using (
    practice_id = public.current_practice_id() or public.current_role() = 'super_admin'
  );

-- ─────────────────────────────────────────────────────────────
-- criteria — DB-backed payer/procedure reference, editable from the admin panel
-- ─────────────────────────────────────────────────────────────
create table if not exists criteria (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  required_fields jsonb not null default '[]'::jsonb,
  red_flags jsonb not null default '[]'::jsonb,
  aetna text not null default '',
  evicore text not null default '',
  sources text not null default '',
  prompt_notes text not null default '',
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists procedure_payer_toggles (
  procedure_key text not null references criteria (key) on delete cascade,
  payer_key text not null,
  enabled boolean not null default true,
  primary key (procedure_key, payer_key)
);

alter table criteria enable row level security;
alter table procedure_payer_toggles enable row level security;

create policy "criteria_select_all_authenticated" on criteria
  for select using (auth.uid() is not null);

create policy "criteria_write_admin" on criteria
  for all using (public.current_role() = 'super_admin')
  with check (public.current_role() = 'super_admin');

create policy "toggles_select_all_authenticated" on procedure_payer_toggles
  for select using (auth.uid() is not null);

create policy "toggles_write_admin" on procedure_payer_toggles
  for all using (public.current_role() = 'super_admin')
  with check (public.current_role() = 'super_admin');

-- ─────────────────────────────────────────────────────────────
-- prompt_templates — the non-procedure-specific wrapper text used in the
-- Claude system prompt, versioned so admins can roll back a bad edit
-- ─────────────────────────────────────────────────────────────
create table if not exists prompt_templates (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  version int not null,
  is_active boolean not null default false,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

alter table prompt_templates enable row level security;

create policy "prompt_templates_select_admin" on prompt_templates
  for select using (public.current_role() = 'super_admin');

create policy "prompt_templates_write_admin" on prompt_templates
  for insert with check (public.current_role() = 'super_admin');

create policy "prompt_templates_update_admin" on prompt_templates
  for update using (public.current_role() = 'super_admin');

-- ─────────────────────────────────────────────────────────────
-- site_content — landing page copy, editable without a code deploy
-- ─────────────────────────────────────────────────────────────
create table if not exists site_content (
  key text primary key,
  value text not null,
  visible boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table site_content enable row level security;

create policy "site_content_select_public" on site_content
  for select using (true);

create policy "site_content_write_admin" on site_content
  for all using (public.current_role() = 'super_admin')
  with check (public.current_role() = 'super_admin');

-- ─────────────────────────────────────────────────────────────
-- profiles: flag-for-review support
-- ─────────────────────────────────────────────────────────────
alter table profiles add column if not exists flagged boolean not null default false;
alter table profiles add column if not exists flagged_reason text;

create policy "profiles_admin_manage" on profiles
  for update using (public.current_role() = 'super_admin');

-- ─────────────────────────────────────────────────────────────
-- bootstrap: promote yourself to super_admin after signing up once
-- ─────────────────────────────────────────────────────────────
-- update profiles set role = 'super_admin' where id = (select id from auth.users where email = 'you@example.com');
