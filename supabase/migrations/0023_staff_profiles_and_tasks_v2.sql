-- Staff profiles (name, avatar, bio, phone) — self-editable only. Title and
-- role stay admin-controlled via the existing Team page; the existing
-- profiles_update_own policy (0001_init.sql) already restricts writes to
-- your own row, so no new update policy is needed here. The trigger below
-- is extended to also strip allowed_sections (alongside the role/
-- practice_id it already protected) as defense in depth on that same
-- own-row path.

alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists bio text;
alter table profiles add column if not exists phone text;

create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.role() <> 'service_role' and public.current_role() <> 'super_admin' then
    new.role := old.role;
    new.practice_id := old.practice_id;
    new.allowed_sections := old.allowed_sections;
  end if;
  return new;
end;
$$;

-- In case an earlier draft of this migration (widened update policy) was
-- already applied — drop it so editing is own-row only.
drop policy if exists "profiles_update_practice" on profiles;

-- Public bucket: profile photos aren't PHI and are shown all over the app
-- (nav, chat, task assignee lists) — signed URLs everywhere would be a lot
-- of overhead for content that isn't sensitive.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars_practice_insert" on storage.objects
  for insert with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = public.current_practice_id()::text
  );

create policy "avatars_practice_update" on storage.objects
  for update using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = public.current_practice_id()::text
  );

create policy "avatars_practice_delete" on storage.objects
  for delete using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = public.current_practice_id()::text
  );

-- Tasks v2: replaces the single assigned_to/status shape from 0022. That
-- migration never actually ran in production (confirmed via a live schema-
-- cache error), so there's no real data to migrate — dropping and
-- rebuilding is simpler and cleaner than a column-by-column alter.
--
-- Visibility model:
--   personal -> only the creator sees it; they can edit/delete/complete it.
--   assigned -> creator (must be admin) + the specific assignees in
--               task_assignees can see it. Only the creator can edit/delete;
--               assignees can only mark their own completion.
--   team     -> creator (must be admin) + every member of the practice can
--               see it. Same edit/delete/completion rule as assigned.
-- task_completions is separate from the task row (not a single status
-- column) so a team/assigned task can track completion per-person — the
-- doctor needs to see who on the team actually did it.
drop table if exists tasks cascade;

create table tasks (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  title text not null,
  description text,
  created_by uuid not null,
  visibility text not null default 'personal' check (visibility in ('personal', 'assigned', 'team')),
  due_date date,
  due_time time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table task_assignees (
  task_id uuid not null references tasks(id) on delete cascade,
  user_id uuid not null,
  primary key (task_id, user_id)
);

create table task_completions (
  task_id uuid not null references tasks(id) on delete cascade,
  user_id uuid not null,
  completed_at timestamptz not null default now(),
  primary key (task_id, user_id)
);

create index tasks_practice_id_idx on tasks(practice_id);
create index task_assignees_user_id_idx on task_assignees(user_id);

alter table tasks enable row level security;
alter table task_assignees enable row level security;
alter table task_completions enable row level security;

create policy "tasks_select" on tasks
  for select using (
    practice_id = public.current_practice_id() and (
      public.current_role() = 'super_admin'
      or visibility = 'team'
      or created_by = auth.uid()
      or exists (select 1 from task_assignees ta where ta.task_id = tasks.id and ta.user_id = auth.uid())
    )
  );

-- Only an admin can create an 'assigned' or 'team' task — anyone can create
-- a 'personal' one for themselves.
create policy "tasks_insert" on tasks
  for insert with check (
    practice_id = public.current_practice_id()
    and created_by = auth.uid()
    and (visibility = 'personal' or public.current_role() in ('clinic_admin', 'super_admin'))
  );

-- Edit/delete is creator-only — staff assigned a task can never edit or
-- remove it, only mark their own completion (task_completions, below).
create policy "tasks_update_own" on tasks
  for update using (practice_id = public.current_practice_id() and created_by = auth.uid());

create policy "tasks_delete_own" on tasks
  for delete using (practice_id = public.current_practice_id() and created_by = auth.uid());

create policy "task_assignees_select" on task_assignees
  for select using (
    exists (select 1 from tasks t where t.id = task_assignees.task_id and t.practice_id = public.current_practice_id())
  );

create policy "task_assignees_insert" on task_assignees
  for insert with check (
    exists (select 1 from tasks t where t.id = task_assignees.task_id and t.practice_id = public.current_practice_id() and t.created_by = auth.uid())
  );

create policy "task_assignees_delete" on task_assignees
  for delete using (
    exists (select 1 from tasks t where t.id = task_assignees.task_id and t.practice_id = public.current_practice_id() and t.created_by = auth.uid())
  );

create policy "task_completions_select" on task_completions
  for select using (
    exists (select 1 from tasks t where t.id = task_completions.task_id and t.practice_id = public.current_practice_id())
  );

-- Anyone who can see the task as an assignee (directly, or via 'team'
-- visibility) can mark their own completion — never someone else's.
create policy "task_completions_insert" on task_completions
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from tasks t where t.id = task_completions.task_id and t.practice_id = public.current_practice_id()
      and (
        t.visibility = 'team'
        or t.created_by = auth.uid()
        or exists (select 1 from task_assignees ta where ta.task_id = t.id and ta.user_id = auth.uid())
      )
    )
  );

create policy "task_completions_delete_own" on task_completions
  for delete using (user_id = auth.uid());
