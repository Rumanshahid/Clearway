-- Phase 3: a Reddit-style Q&A forum (questions + answers, each with their
-- own likes/upvotes), a cross-cutting follow system, and a single
-- notification on/off preference -- both reused by the blog (phase 2) and
-- this forum rather than building separate per-feature toggles.

create table questions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  tags text[] not null default '{}',
  author_type text not null default 'staff' check (author_type in ('staff', 'patient')),
  author_id uuid references profiles(id) on delete set null,
  patient_author_id uuid references patient_accounts(id) on delete set null,
  upvote_count integer not null default 0,
  ai_flagged boolean not null default false,
  ai_flag_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index questions_created_at_idx on questions(created_at desc);
create index questions_upvote_count_idx on questions(upvote_count desc);

alter table questions enable row level security;
create policy "questions_select_all" on questions for select using (true);
create policy "questions_insert_own" on questions
  for insert with check (
    (author_type = 'staff' and author_id = auth.uid())
    or (author_type = 'patient' and patient_author_id = auth.uid())
  );
create policy "questions_update_own_or_admin" on questions
  for update using (author_id = auth.uid() or patient_author_id = auth.uid() or public.current_role() = 'super_admin');
create policy "questions_delete_own_or_admin" on questions
  for delete using (author_id = auth.uid() or patient_author_id = auth.uid() or public.current_role() = 'super_admin');

create table answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  author_type text not null default 'staff' check (author_type in ('staff', 'patient')),
  author_id uuid references profiles(id) on delete set null,
  patient_author_id uuid references patient_accounts(id) on delete set null,
  content text not null,
  upvote_count integer not null default 0,
  ai_flagged boolean not null default false,
  ai_flag_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index answers_question_id_idx on answers(question_id, created_at);

alter table answers enable row level security;
create policy "answers_select_all" on answers for select using (true);
create policy "answers_insert_own" on answers
  for insert with check (
    (author_type = 'staff' and author_id = auth.uid())
    or (author_type = 'patient' and patient_author_id = auth.uid())
  );
create policy "answers_update_own_or_admin" on answers
  for update using (author_id = auth.uid() or patient_author_id = auth.uid() or public.current_role() = 'super_admin');
create policy "answers_delete_own_or_admin" on answers
  for delete using (author_id = auth.uid() or patient_author_id = auth.uid() or public.current_role() = 'super_admin');

create table question_likes (
  question_id uuid not null references questions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (question_id, user_id)
);
alter table question_likes enable row level security;
create policy "question_likes_select_all" on question_likes for select using (true);
create policy "question_likes_insert_own" on question_likes for insert with check (user_id = auth.uid());
create policy "question_likes_delete_own" on question_likes for delete using (user_id = auth.uid());

create table question_upvotes (
  question_id uuid not null references questions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (question_id, user_id)
);
alter table question_upvotes enable row level security;
create policy "question_upvotes_select_all" on question_upvotes for select using (true);
create policy "question_upvotes_insert_own" on question_upvotes for insert with check (user_id = auth.uid());
create policy "question_upvotes_delete_own" on question_upvotes for delete using (user_id = auth.uid());

create table answer_likes (
  answer_id uuid not null references answers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (answer_id, user_id)
);
alter table answer_likes enable row level security;
create policy "answer_likes_select_all" on answer_likes for select using (true);
create policy "answer_likes_insert_own" on answer_likes for insert with check (user_id = auth.uid());
create policy "answer_likes_delete_own" on answer_likes for delete using (user_id = auth.uid());

create table answer_upvotes (
  answer_id uuid not null references answers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (answer_id, user_id)
);
alter table answer_upvotes enable row level security;
create policy "answer_upvotes_select_all" on answer_upvotes for select using (true);
create policy "answer_upvotes_insert_own" on answer_upvotes for insert with check (user_id = auth.uid());
create policy "answer_upvotes_delete_own" on answer_upvotes for delete using (user_id = auth.uid());

create or replace function public.question_upvotes_sync_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update questions set upvote_count = upvote_count + 1 where id = new.question_id;
    return new;
  elsif tg_op = 'DELETE' then
    update questions set upvote_count = upvote_count - 1 where id = old.question_id;
    return old;
  end if;
  return null;
end;
$$;
create trigger question_upvotes_after_insert after insert on question_upvotes for each row execute procedure public.question_upvotes_sync_count();
create trigger question_upvotes_after_delete after delete on question_upvotes for each row execute procedure public.question_upvotes_sync_count();

create or replace function public.answer_upvotes_sync_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update answers set upvote_count = upvote_count + 1 where id = new.answer_id;
    return new;
  elsif tg_op = 'DELETE' then
    update answers set upvote_count = upvote_count - 1 where id = old.answer_id;
    return old;
  end if;
  return null;
end;
$$;
create trigger answer_upvotes_after_insert after insert on answer_upvotes for each row execute procedure public.answer_upvotes_sync_count();
create trigger answer_upvotes_after_delete after delete on answer_upvotes for each row execute procedure public.answer_upvotes_sync_count();

-- Follows span both the blog and this forum -- a single follower/followed
-- pair of auth.uid()s, not scoped to "followed in the blog" vs "followed in
-- Q&A", since the user asked to follow "each other" as people, not per-feature.
create table user_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followed_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  constraint user_follows_no_self_follow check (follower_id <> followed_id)
);
alter table user_follows enable row level security;
create policy "user_follows_select_all" on user_follows for select using (true);
create policy "user_follows_insert_own" on user_follows for insert with check (follower_id = auth.uid());
create policy "user_follows_delete_own" on user_follows for delete using (follower_id = auth.uid());

-- A single on/off switch per user for "notify me about activity from people
-- I follow" -- covers both new blog posts and new questions, rather than a
-- separate toggle per feature. Absence of a row means "on" (opt-out, not
-- opt-in), matching the signup default of consent_notifications=true intent.
create table notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  follow_activity_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table notification_preferences enable row level security;
create policy "notification_preferences_select_own" on notification_preferences for select using (user_id = auth.uid());
create policy "notification_preferences_upsert_own" on notification_preferences for insert with check (user_id = auth.uid());
create policy "notification_preferences_update_own" on notification_preferences for update using (user_id = auth.uid());
