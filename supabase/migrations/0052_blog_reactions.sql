-- Multiple reaction types instead of a single like -- LinkedIn-style
-- reaction picker (Like, Support, Insightful, Love, Laugh, Angry, Sad).
-- One reaction per user per post; picking a different one updates the
-- existing row rather than adding a second (the primary key is still
-- (post_id, user_id)). Existing rows default to 'like' so nothing already
-- recorded is lost.
alter table blog_likes add column if not exists reaction_type text not null default 'like'
  check (reaction_type in ('like', 'support', 'insightful', 'love', 'laugh', 'angry', 'sad'));

-- Needed so an existing reaction can change type via update rather than a
-- delete+insert -- blog_likes previously only had select/insert/delete
-- policies since there was nothing to update before.
create policy "blog_likes_update_own" on blog_likes for update using (user_id = auth.uid());
