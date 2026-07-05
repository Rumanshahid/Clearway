-- Insurance eligibility verification log. There's no real-time
-- clearinghouse (Availity, Change Healthcare, etc.) integration configured —
-- that requires a signed business account this migration can't create.
-- This is a manual log: staff verify coverage via the payer's portal or a
-- phone call, then record the result here, same real-world workflow every
-- practice already follows, just tracked instead of living on a sticky note.

create table eligibility_checks (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  checked_by uuid not null,
  checked_at timestamptz not null default now(),

  payer text,
  member_id text,
  plan_type text,
  status text not null,
  method text not null default 'Payer portal',
  deductible_remaining numeric,
  copay_amount numeric,
  notes text,

  created_at timestamptz not null default now()
);

create index eligibility_checks_patient_id_idx on eligibility_checks(patient_id);

alter table eligibility_checks enable row level security;

create policy "eligibility_checks_select_practice" on eligibility_checks
  for select using (
    practice_id = public.current_practice_id() or public.current_role() = 'super_admin'
  );

create policy "eligibility_checks_insert_practice" on eligibility_checks
  for insert with check (practice_id = public.current_practice_id());

create policy "eligibility_checks_delete_practice" on eligibility_checks
  for delete using (practice_id = public.current_practice_id());
