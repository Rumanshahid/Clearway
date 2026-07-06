-- Same "infinite recursion detected in policy" bug as 0024 (tasks), just in
-- the chat schema: conversations_select_member checks conversation_members
-- for membership, while conversation_members' own select/insert/delete
-- policies check back into conversations for practice_id — each table's
-- RLS evaluation triggers the other's, looping forever. This is why
-- ensureTeamConversation and "Create group" never actually create anything
-- (every select/insert on conversations errors out with 42P17). Same fix as
-- 0024: security definer helper functions break the cycle by running as the
-- table owner, which bypasses RLS on the query made *inside* the function.

create or replace function public.is_conversation_member(p_conversation_id uuid, p_user_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from conversation_members where conversation_id = p_conversation_id and user_id = p_user_id);
$$;

create or replace function public.conversation_practice_id(p_conversation_id uuid)
returns uuid
language sql stable security definer set search_path = public
as $$
  select practice_id from conversations where id = p_conversation_id;
$$;

drop policy if exists "conversations_select_member" on conversations;
create policy "conversations_select_member" on conversations
  for select using (
    practice_id = public.current_practice_id() and (
      public.current_role() = 'super_admin'
      or created_by = auth.uid()
      or public.is_conversation_member(id, auth.uid())
    )
  );

drop policy if exists "conversation_members_select_practice" on conversation_members;
create policy "conversation_members_select_practice" on conversation_members
  for select using (public.conversation_practice_id(conversation_id) = public.current_practice_id());

drop policy if exists "conversation_members_insert_practice" on conversation_members;
create policy "conversation_members_insert_practice" on conversation_members
  for insert with check (public.conversation_practice_id(conversation_id) = public.current_practice_id());

drop policy if exists "conversation_members_delete_practice" on conversation_members;
create policy "conversation_members_delete_practice" on conversation_members
  for delete using (public.conversation_practice_id(conversation_id) = public.current_practice_id());
