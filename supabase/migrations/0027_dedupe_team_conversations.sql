-- While conversations RLS was recursing (0021-0025), every failed attempt
-- to create the default "Team" conversation still landed a row (the insert
-- succeeded — only the follow-up select-back was blocked), so several
-- practices ended up with duplicate 'team' conversations. Keep the oldest
-- per practice and drop the rest (cascade removes their now-orphaned
-- conversation_members rows too — none of these duplicates have real
-- messages, they're artifacts of the broken create flow).
delete from conversations
where type = 'team'
  and id not in (
    select distinct on (practice_id) id
    from conversations
    where type = 'team'
    order by practice_id, created_at asc
  );

-- Prevents this from recurring: layout.tsx and chat/page.tsx both call
-- ensureTeamConversation in the same request, so two concurrent "does it
-- exist yet? no -> create it" checks are possible. This makes the second
-- insert fail with a unique violation instead of creating a duplicate;
-- ensureTeamConversation is updated to fall back to re-fetching the
-- existing row when that happens.
create unique index if not exists conversations_one_team_per_practice on conversations (practice_id) where type = 'team';
