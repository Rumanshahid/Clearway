-- Patients can read/like/upvote/comment on blog posts but not author them
-- -- previously any signed-in patient_accounts identity could insert a
-- post (see 0040_blog_social.sql). Existing patient-authored posts are
-- untouched (still readable, still owner-editable); only new inserts are
-- restricted to staff going forward. Enforced in the app too
-- (blog/actions.ts, blog/new/page.tsx) -- this is the defense-in-depth layer.
drop policy if exists "blog_posts_insert_own" on blog_posts;
create policy "blog_posts_insert_staff_only" on blog_posts
  for insert with check (author_type = 'staff' and author_id = auth.uid());
