-- 0028's unique index only stops *new* duplicates — existing 'dm' rows
-- from earlier testing (back when handleStartDm existed, before this
-- migration) have dm_user_a/dm_user_b left NULL, and NULLs are never
-- considered equal for uniqueness in Postgres, so those old orphaned rows
-- don't conflict with each other or with the new properly-keyed one.
--
-- Order matters: delete the duplicates *first* (computed via a join to
-- conversation_members, independent of the not-yet-backfilled column), so
-- the later UPDATE only ever writes one row per pair — setting the same
-- (dm_user_a, dm_user_b) on two rows in the same statement trips the
-- unique index immediately, which is what the first attempt at this
-- migration hit.
with pairs as (
  select
    c.id as conversation_id,
    c.created_at,
    (array_agg(cm.user_id order by cm.user_id))[1] as user_a,
    (array_agg(cm.user_id order by cm.user_id))[2] as user_b
  from conversations c
  join conversation_members cm on cm.conversation_id = c.id
  where c.type = 'dm'
  group by c.id, c.created_at
  having count(*) = 2
),
ranked as (
  select conversation_id, user_a, user_b,
    row_number() over (partition by user_a, user_b order by created_at asc) as rn
  from pairs
)
delete from conversations
where id in (select conversation_id from ranked where rn > 1);

-- Exactly one row per pair remains now — safe to backfill.
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
