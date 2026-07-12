-- Per-doctor Gmail connection (OAuth tokens) plus a local cache of inbox
-- messages Claude has classified as medical/patient-related, so a dashboard
-- load doesn't need to hit Gmail + Claude on every single view -- only new
-- messages since the last sync get fetched and classified.

create table email_connections (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  doctor_profile_id uuid not null unique references doctor_profiles(id) on delete cascade,

  email_address text not null,
  access_token text not null,
  refresh_token text not null,
  token_expires_at timestamptz not null,
  last_synced_at timestamptz,

  created_at timestamptz not null default now()
);

alter table email_connections enable row level security;

create policy "email_connections_select_practice" on email_connections
  for select using (practice_id = public.current_practice_id() or public.current_role() = 'super_admin');
create policy "email_connections_insert_practice" on email_connections
  for insert with check (practice_id = public.current_practice_id());
create policy "email_connections_update_practice" on email_connections
  for update using (practice_id = public.current_practice_id());
create policy "email_connections_delete_practice" on email_connections
  for delete using (practice_id = public.current_practice_id());

create table inbox_messages (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  doctor_profile_id uuid not null references doctor_profiles(id) on delete cascade,

  gmail_message_id text not null,
  gmail_thread_id text not null,
  message_id_header text, -- RFC 2822 Message-Id header, needed to thread a reply via In-Reply-To/References
  from_address text not null,
  from_name text,
  subject text,
  snippet text,
  received_at timestamptz not null,

  category text not null check (category in ('medical_question', 'patient_inquiry', 'faq', 'other')),
  is_relevant boolean not null default false,
  replied boolean not null default false,

  created_at timestamptz not null default now(),
  unique (doctor_profile_id, gmail_message_id)
);

create index inbox_messages_doctor_idx on inbox_messages(doctor_profile_id, received_at desc);

alter table inbox_messages enable row level security;

create policy "inbox_messages_select_practice" on inbox_messages
  for select using (practice_id = public.current_practice_id() or public.current_role() = 'super_admin');
create policy "inbox_messages_insert_practice" on inbox_messages
  for insert with check (practice_id = public.current_practice_id());
create policy "inbox_messages_update_practice" on inbox_messages
  for update using (practice_id = public.current_practice_id());
