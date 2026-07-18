-- Patient profile picture. Reuses the existing public "avatars" bucket
-- (0023) rather than a new one -- photos aren't PHI. Staff can only write
-- under their own practice_id folder there, which patients don't have, so
-- this adds a parallel folder convention: patients/<patient_account_id>-*.
alter table patient_accounts add column if not exists avatar_url text;

drop policy if exists "avatars_patient_insert" on storage.objects;
create policy "avatars_patient_insert" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'patients'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists "avatars_patient_update" on storage.objects;
create policy "avatars_patient_update" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'patients'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists "avatars_patient_delete" on storage.objects;
create policy "avatars_patient_delete" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'patients'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
