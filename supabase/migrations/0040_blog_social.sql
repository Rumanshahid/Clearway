-- Blog phase 2: multi-author posts (staff or patient accounts), likes,
-- comments, and an upvote-driven ranking. Author identity for a post is
-- now one of two mutually exclusive columns rather than a single
-- `profiles`-only `author_id`, since patient_accounts rows have no
-- corresponding profiles row (see 0039_patient_accounts.sql).
alter table blog_posts add column if not exists author_type text not null default 'staff' check (author_type in ('staff', 'patient'));
alter table blog_posts add column if not exists patient_author_id uuid references patient_accounts(id) on delete set null;
alter table blog_posts add column if not exists upvote_count integer not null default 0;
-- Set by the AI alarming-content check at publish time -- posts are never
-- held back for review (published immediately per product decision), this
-- only flags them for the super_admin to look at after the fact.
alter table blog_posts add column if not exists ai_flagged boolean not null default false;
alter table blog_posts add column if not exists ai_flag_reason text;

create index if not exists blog_posts_upvote_count_idx on blog_posts(upvote_count desc);

-- Replace the super_admin-only write policies with owner-or-super_admin --
-- any signed-in staff or patient account can now author a post, but only
-- the post's own author or a super_admin can edit/delete it.
drop policy if exists "blog_posts_select_admin" on blog_posts;
drop policy if exists "blog_posts_insert_admin" on blog_posts;
drop policy if exists "blog_posts_update_admin" on blog_posts;
drop policy if exists "blog_posts_delete_admin" on blog_posts;

create policy "blog_posts_select_own_or_admin" on blog_posts
  for select using (
    author_id = auth.uid() or patient_author_id = auth.uid() or public.current_role() = 'super_admin'
  );
create policy "blog_posts_insert_own" on blog_posts
  for insert with check (
    (author_type = 'staff' and author_id = auth.uid())
    or (author_type = 'patient' and patient_author_id = auth.uid())
  );
create policy "blog_posts_update_own_or_admin" on blog_posts
  for update using (
    author_id = auth.uid() or patient_author_id = auth.uid() or public.current_role() = 'super_admin'
  );
create policy "blog_posts_delete_own_or_admin" on blog_posts
  for delete using (
    author_id = auth.uid() or patient_author_id = auth.uid() or public.current_role() = 'super_admin'
  );

create table if not exists blog_likes (
  post_id uuid not null references blog_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table blog_likes enable row level security;
create policy "blog_likes_select_all" on blog_likes for select using (true);
create policy "blog_likes_insert_own" on blog_likes for insert with check (user_id = auth.uid());
create policy "blog_likes_delete_own" on blog_likes for delete using (user_id = auth.uid());

create table if not exists blog_upvotes (
  post_id uuid not null references blog_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table blog_upvotes enable row level security;
create policy "blog_upvotes_select_all" on blog_upvotes for select using (true);
create policy "blog_upvotes_insert_own" on blog_upvotes for insert with check (user_id = auth.uid());
create policy "blog_upvotes_delete_own" on blog_upvotes for delete using (user_id = auth.uid());

-- Denormalized onto blog_posts.upvote_count for cheap "top" sorting --
-- recomputing count(*) on every list-page load would mean a join + group
-- by across every post on every request.
create or replace function public.blog_upvotes_sync_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update blog_posts set upvote_count = upvote_count + 1 where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update blog_posts set upvote_count = upvote_count - 1 where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger blog_upvotes_after_insert
  after insert on blog_upvotes
  for each row execute procedure public.blog_upvotes_sync_count();
create trigger blog_upvotes_after_delete
  after delete on blog_upvotes
  for each row execute procedure public.blog_upvotes_sync_count();

create table if not exists blog_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references blog_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  ai_flagged boolean not null default false,
  ai_flag_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists blog_comments_post_id_idx on blog_comments(post_id, created_at);
alter table blog_comments enable row level security;
create policy "blog_comments_select_all" on blog_comments for select using (true);
create policy "blog_comments_insert_own" on blog_comments for insert with check (user_id = auth.uid());
-- Comment owner can edit/delete their own; super_admin can delete (moderation)
-- but not silently edit someone else's words, so update stays owner-only.
create policy "blog_comments_update_own" on blog_comments for update using (user_id = auth.uid());
create policy "blog_comments_delete_own_or_admin" on blog_comments
  for delete using (user_id = auth.uid() or public.current_role() = 'super_admin');
