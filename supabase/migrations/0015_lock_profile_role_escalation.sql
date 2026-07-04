-- The "profiles_update_own" policy (0001_init.sql) lets a user update their
-- own profile row, but RLS policies don't restrict individual columns —
-- meaning any signed-in user could call supabase.from("profiles").update({
-- role: "super_admin" }) directly and grant themselves admin access. This
-- trigger closes that gap while preserving the two legitimate paths that
-- change role/practice_id today: the service-role client (onboarding, the
-- new /setup-admin bootstrap flow) and an existing super_admin managing
-- another user's role from /admin/users (via "profiles_admin_manage",
-- 0002_billing_admin.sql — that path uses the regular client, not the
-- service-role key, so it must stay explicitly allowed here).

create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.role() <> 'service_role' and public.current_role() <> 'super_admin' then
    new.role := old.role;
    new.practice_id := old.practice_id;
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_privilege_escalation
  before update on profiles
  for each row
  execute function public.prevent_profile_privilege_escalation();
