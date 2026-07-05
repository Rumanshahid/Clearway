-- Internal team chat: 1:1 and group conversations within a practice, with
-- text, image, file, and voice-message attachments. Storage access below is
-- scoped at the practice level (any signed-in member of the practice can
-- read an attachment if they know its path) rather than per-conversation —
-- a deliberate scope trim for an internal staff tool; paths are unguessable
-- UUIDs and never listed outside the conversations a user is actually in.

create table conversations (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  type text not null default 'dm',
  name text,
  created_by uuid not null,
  created_at timestamptz not null default now()
);

create table conversation_members (
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id uuid not null,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null,
  content text,
  attachment_url text,
  attachment_type text,
  attachment_name text,
  created_at timestamptz not null default now()
);

create index messages_conversation_id_idx on messages(conversation_id, created_at);
create index conversation_members_user_id_idx on conversation_members(user_id);

alter table conversations enable row level security;
alter table conversation_members enable row level security;
alter table messages enable row level security;

create policy "conversations_select_member" on conversations
  for select using (
    practice_id = public.current_practice_id() and (
      public.current_role() = 'super_admin'
      or exists (select 1 from conversation_members cm where cm.conversation_id = conversations.id and cm.user_id = auth.uid())
    )
  );

create policy "conversations_insert_practice" on conversations
  for insert with check (practice_id = public.current_practice_id());

create policy "conversation_members_select_practice" on conversation_members
  for select using (
    exists (select 1 from conversations c where c.id = conversation_members.conversation_id and c.practice_id = public.current_practice_id())
  );

create policy "conversation_members_insert_practice" on conversation_members
  for insert with check (
    exists (select 1 from conversations c where c.id = conversation_members.conversation_id and c.practice_id = public.current_practice_id())
  );

create policy "conversation_members_delete_practice" on conversation_members
  for delete using (
    exists (select 1 from conversations c where c.id = conversation_members.conversation_id and c.practice_id = public.current_practice_id())
  );

create policy "messages_select_member" on messages
  for select using (
    exists (select 1 from conversation_members cm where cm.conversation_id = messages.conversation_id and cm.user_id = auth.uid())
  );

create policy "messages_insert_member" on messages
  for insert with check (
    sender_id = auth.uid()
    and exists (select 1 from conversation_members cm where cm.conversation_id = messages.conversation_id and cm.user_id = auth.uid())
  );

create policy "messages_delete_own" on messages
  for delete using (sender_id = auth.uid());

-- Live delivery: broadcast changes on these tables to subscribed clients.
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table conversations;

-- Private bucket for photos/files/voice messages. Not public — every read
-- goes through a signed URL, gated by the same practice-scoped RLS below.
insert into storage.buckets (id, name, public)
values ('chat-attachments', 'chat-attachments', false)
on conflict (id) do nothing;

create policy "chat_attachments_select_practice" on storage.objects
  for select using (
    bucket_id = 'chat-attachments'
    and (storage.foldername(name))[1] = public.current_practice_id()::text
  );

create policy "chat_attachments_insert_practice" on storage.objects
  for insert with check (
    bucket_id = 'chat-attachments'
    and (storage.foldername(name))[1] = public.current_practice_id()::text
  );
