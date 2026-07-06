-- The previous approach (only the lexicographically-smaller user id in a
-- pair ever attempts to create the DM) has a real gap: if that person
-- never loads a page, the DM never gets created for either side — even
-- the other person, who's actively using the app, never sees it. Fixing
-- this properly with a database-enforced pair key instead of a client-side
-- ordering trick, so *either* side can create it and the DB rejects the
-- duplicate if both try around the same time.
alter table conversations add column if not exists dm_user_a uuid;
alter table conversations add column if not exists dm_user_b uuid;

create unique index if not exists conversations_one_dm_per_pair on conversations (dm_user_a, dm_user_b) where type = 'dm';
