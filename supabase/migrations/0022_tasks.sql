-- Task assignment / to-do list. A doctor/admin can assign a task to any
-- staff member (or themselves); staff can create tasks for themselves too.
-- No separate "who can see what" complexity — visibility is: your own
-- tasks (assigned to you or created by you), or everything if you're an
-- admin, matching how Team page activity is already scoped.

create table tasks (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  title text not null,
  description text,
  assigned_to uuid not null,
  assigned_by uuid not null,
  status text not null default 'pending',
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_practice_id_idx on tasks(practice_id);
create index tasks_assigned_to_idx on tasks(assigned_to);

alter table tasks enable row level security;

create policy "tasks_select_practice" on tasks
  for select using (
    practice_id = public.current_practice_id() or public.current_role() = 'super_admin'
  );

create policy "tasks_insert_practice" on tasks
  for insert with check (practice_id = public.current_practice_id());

create policy "tasks_update_practice" on tasks
  for update using (practice_id = public.current_practice_id());

create policy "tasks_delete_practice" on tasks
  for delete using (practice_id = public.current_practice_id());
