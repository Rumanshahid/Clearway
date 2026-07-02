-- pa_requests had select/insert/update RLS policies but no delete policy,
-- so DELETE statements were silently blocked (0 rows affected, no error) —
-- the dashboard's delete button looked like it did nothing.

create policy "pa_requests_delete_practice" on pa_requests
  for delete using (practice_id = public.current_practice_id());
