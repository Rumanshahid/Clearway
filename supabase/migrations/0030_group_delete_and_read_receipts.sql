-- Group delete: conversations had no delete policy at all. Scoped to
-- type='group' and creator-only (matching the tasks page's canManage
-- pattern) — Team and DMs stay undeletable this way, they're auto-managed.
create policy "conversations_delete_own_group" on conversations
  for delete using (type = 'group' and created_by = auth.uid());

-- Read receipts: one row per (conversation, user) tracking when they last
-- viewed it. "Seen" for a message means every other member's last_read_at
-- is at or after that message's created_at — reusing the existing
-- is_conversation_member() security-definer helper (0026) to avoid the
-- same select-policy recursion already fixed once on this schema.
create table conversation_reads (
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id uuid not null,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

alter table conversation_reads enable row level security;

create policy "conversation_reads_select_member" on conversation_reads
  for select using (public.is_conversation_member(conversation_id, auth.uid()));

create policy "conversation_reads_insert_own" on conversation_reads
  for insert with check (user_id = auth.uid() and public.is_conversation_member(conversation_id, auth.uid()));

create policy "conversation_reads_update_own" on conversation_reads
  for update using (user_id = auth.uid());

alter publication supabase_realtime add table conversation_reads;
