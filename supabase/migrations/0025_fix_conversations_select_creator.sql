-- Creating a conversation (INSERT ... SELECT in one round trip, as both
-- ensureTeamConversation and handleCreateGroup do) was silently returning
-- no row: the INSERT itself passes conversations_insert_practice, but the
-- immediately-following SELECT (PostgREST returning the inserted row) was
-- evaluated against conversations_select_member, which only allowed rows
-- where the caller is *already* a conversation_members row — impossible at
-- the instant of creation, since members are only added in the next
-- statement. The row landed in the table but came back as null to the
-- client, which then bailed out before ever inserting members, leaving an
-- orphaned, member-less conversation. Every "Create group" click has
-- silently done this since the chat feature was first built — it never
-- actually worked. Letting the creator see their own row fixes both that
-- and the new default-Team-conversation logic.
drop policy if exists "conversations_select_member" on conversations;
create policy "conversations_select_member" on conversations
  for select using (
    practice_id = public.current_practice_id() and (
      public.current_role() = 'super_admin'
      or created_by = auth.uid()
      or exists (select 1 from conversation_members cm where cm.conversation_id = conversations.id and cm.user_id = auth.uid())
    )
  );
