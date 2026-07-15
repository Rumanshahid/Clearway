-- Company blog. Single-author (super_admin only), Markdown content stored
-- as plain text and rendered at request time -- no separate rich-content
-- format to keep in sync.
create table blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null default '',
  cover_image_url text,
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published')),
  seo_title text,
  seo_description text,
  author_id uuid references profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index blog_posts_status_published_idx on blog_posts(status, published_at desc);

alter table blog_posts enable row level security;

create policy "blog_posts_select_published" on blog_posts
  for select using (status = 'published');
create policy "blog_posts_select_admin" on blog_posts
  for select using (public.current_role() = 'super_admin');
create policy "blog_posts_insert_admin" on blog_posts
  for insert with check (public.current_role() = 'super_admin');
create policy "blog_posts_update_admin" on blog_posts
  for update using (public.current_role() = 'super_admin');
create policy "blog_posts_delete_admin" on blog_posts
  for delete using (public.current_role() = 'super_admin');

-- Cover images -- public read (blog is public), writes restricted to the
-- same super_admin-only authorship as the posts themselves.
insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do nothing;

drop policy if exists "blog_images_public_read" on storage.objects;
create policy "blog_images_public_read" on storage.objects
  for select using (bucket_id = 'blog-images');

drop policy if exists "blog_images_admin_insert" on storage.objects;
create policy "blog_images_admin_insert" on storage.objects
  for insert with check (bucket_id = 'blog-images' and public.current_role() = 'super_admin');

drop policy if exists "blog_images_admin_update" on storage.objects;
create policy "blog_images_admin_update" on storage.objects
  for update using (bucket_id = 'blog-images' and public.current_role() = 'super_admin');

drop policy if exists "blog_images_admin_delete" on storage.objects;
create policy "blog_images_admin_delete" on storage.objects
  for delete using (bucket_id = 'blog-images' and public.current_role() = 'super_admin');
