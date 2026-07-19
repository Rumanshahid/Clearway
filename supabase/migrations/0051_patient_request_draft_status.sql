-- Adds a 'draft' status so a patient's request starts as a draft (letter
-- auto-generated but not yet actually sent to the insurer) and the patient
-- explicitly flips it to 'submitted' once they've sent it themselves --
-- there's no automatic transmission to the payer, so the app shouldn't
-- claim "submitted" the moment the letter is drafted.
-- Constraint names below are Postgres's default auto-generated name for an
-- inline column-level check (<table>_<column>_check), matching how
-- 0045_patient_pa_and_appeals.sql originally declared them.
alter table patient_pa_requests drop constraint if exists patient_pa_requests_status_check;
alter table patient_pa_requests add constraint patient_pa_requests_status_check
  check (status in ('draft', 'submitted', 'in_review', 'resolved'));
alter table patient_pa_requests alter column status set default 'draft';

alter table patient_appeal_requests drop constraint if exists patient_appeal_requests_status_check;
alter table patient_appeal_requests add constraint patient_appeal_requests_status_check
  check (status in ('draft', 'submitted', 'in_review', 'resolved'));
alter table patient_appeal_requests alter column status set default 'draft';
