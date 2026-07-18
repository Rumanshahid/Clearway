-- Patients (patient_accounts) have no profiles row, so the notifications
-- table's original FK to profiles(id) silently excluded them from ever
-- having a notification. notification_preferences (0041) already made
-- this same call by targeting auth.users(id) directly -- apply it here too.
alter table notifications drop constraint notifications_user_id_fkey;
alter table notifications add constraint notifications_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
