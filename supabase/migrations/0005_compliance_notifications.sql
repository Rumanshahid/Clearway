-- Clearway — Phase 4: BAA acceptance, retention policy, in-app notifications.

alter table practices add column if not exists baa_accepted_at timestamptz;
alter table practices add column if not exists baa_accepted_by uuid references profiles (id);
alter table practices add column if not exists retention_months int not null default 12;

-- ─────────────────────────────────────────────────────────────
-- notifications — in-app bell
-- ─────────────────────────────────────────────────────────────
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  type text not null,
  message text not null,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on notifications (user_id, created_at desc);

alter table notifications enable row level security;

create policy "notifications_select_own" on notifications
  for select using (user_id = auth.uid());

create policy "notifications_update_own" on notifications
  for update using (user_id = auth.uid());

create policy "notifications_insert_any" on notifications
  for insert with check (true);
