-- "infinite recursion detected in policy for relation tasks" — tasks_select
-- queries task_assignees to check assignee membership, while
-- task_assignees' own policies query tasks to check practice/ownership.
-- Evaluating either table's RLS then requires evaluating the other's,
-- looping forever. Fixed the same way current_practice_id()/current_role()
-- (0001_init.sql) already avoid this on profiles: security definer
-- functions run as the function owner (the migration role, which owns
-- these tables and is therefore RLS-exempt on them), so a query made
-- *inside* one of these functions never re-triggers the calling table's
-- policy — breaking the cycle.

create or replace function public.task_practice_id(p_task_id uuid)
returns uuid
language sql stable security definer set search_path = public
as $$
  select practice_id from tasks where id = p_task_id;
$$;

create or replace function public.task_created_by(p_task_id uuid)
returns uuid
language sql stable security definer set search_path = public
as $$
  select created_by from tasks where id = p_task_id;
$$;

create or replace function public.task_visibility(p_task_id uuid)
returns text
language sql stable security definer set search_path = public
as $$
  select visibility from tasks where id = p_task_id;
$$;

create or replace function public.is_task_assignee(p_task_id uuid, p_user_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from task_assignees where task_id = p_task_id and user_id = p_user_id);
$$;

drop policy if exists "tasks_select" on tasks;
create policy "tasks_select" on tasks
  for select using (
    practice_id = public.current_practice_id() and (
      public.current_role() = 'super_admin'
      or visibility = 'team'
      or created_by = auth.uid()
      or public.is_task_assignee(id, auth.uid())
    )
  );

drop policy if exists "task_assignees_select" on task_assignees;
create policy "task_assignees_select" on task_assignees
  for select using (public.task_practice_id(task_id) = public.current_practice_id());

drop policy if exists "task_assignees_insert" on task_assignees;
create policy "task_assignees_insert" on task_assignees
  for insert with check (
    public.task_practice_id(task_id) = public.current_practice_id()
    and public.task_created_by(task_id) = auth.uid()
  );

drop policy if exists "task_assignees_delete" on task_assignees;
create policy "task_assignees_delete" on task_assignees
  for delete using (
    public.task_practice_id(task_id) = public.current_practice_id()
    and public.task_created_by(task_id) = auth.uid()
  );

drop policy if exists "task_completions_select" on task_completions;
create policy "task_completions_select" on task_completions
  for select using (public.task_practice_id(task_id) = public.current_practice_id());

drop policy if exists "task_completions_insert" on task_completions;
create policy "task_completions_insert" on task_completions
  for insert with check (
    user_id = auth.uid()
    and public.task_practice_id(task_id) = public.current_practice_id()
    and (
      public.task_visibility(task_id) = 'team'
      or public.task_created_by(task_id) = auth.uid()
      or public.is_task_assignee(task_id, auth.uid())
    )
  );
