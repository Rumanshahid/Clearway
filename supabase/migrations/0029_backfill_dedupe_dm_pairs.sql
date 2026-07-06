-- 0028's unique index only stops *new* duplicates — existing 'dm' rows
-- from earlier testing (back when handleStartDm existed, before this
-- migration) have dm_user_a/dm_user_b left NULL, and NULLs are never
-- considered equal for uniqueness in Postgres, so those old orphaned rows
-- don't conflict with each other or with the new properly-keyed one.
-- Backfill the pair key from actual membership, then keep only the oldest
-- conversation per pair.
with pairs as (
  select
    c.id as conversation_id,
    (array_agg(cm.user_id order by cm.user_id))[1] as user_a,
    (array_agg(cm.user_id order by cm.user_id))[2] as user_b
  from conversations c
  join conversation_members cm on cm.conversation_id = c.id
  where c.type = 'dm'
  group by c.id
  having count(*) = 2
)
update conversations c
set dm_user_a = p.user_a, dm_user_b = p.user_b
from pairs p
where c.id = p.conversation_id and c.dm_user_a is null;

delete from conversations
where type = 'dm'
  and dm_user_a is not null
  and id not in (
    select distinct on (dm_user_a, dm_user_b) id
    from conversations
    where type = 'dm' and dm_user_a is not null
    order by dm_user_a, dm_user_b, created_at asc
  );
