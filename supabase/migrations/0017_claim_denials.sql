-- Claims denial & appeal tracking — separate from pa_requests since a
-- denial can exist with no prior PA in Asaanbil at all (e.g. CO-197, no
-- PA obtained), and can optionally reference one that was submitted here.

create table claim_denials (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  created_by uuid not null,
  patient_id uuid references patients(id) on delete set null,
  pa_request_id uuid references pa_requests(id) on delete set null,

  date_of_service date,
  cpt_code text,
  icd10_code text,
  claim_number text,
  amount_billed numeric,
  amount_denied numeric,
  amount_recovered numeric,
  date_submitted date,

  denial_date date not null,
  denial_reason_code text not null,
  denial_reason_description text,
  payer text,
  payer_claim_reference text,
  pa_obtained text,

  appeal_deadline date,
  appeal_type text,
  assigned_to uuid,
  priority text not null default 'Standard',
  status text not null default 'open',

  new_clinical_evidence text,
  supporting_documentation text,
  p2p_requested boolean not null default false,
  filing_method text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index claim_denials_practice_id_idx on claim_denials(practice_id);

alter table claim_denials enable row level security;

create policy "claim_denials_select_practice" on claim_denials
  for select using (
    practice_id = public.current_practice_id() or public.current_role() = 'super_admin'
  );

create policy "claim_denials_insert_practice" on claim_denials
  for insert with check (practice_id = public.current_practice_id());

create policy "claim_denials_update_practice" on claim_denials
  for update using (practice_id = public.current_practice_id());

create policy "claim_denials_delete_practice" on claim_denials
  for delete using (practice_id = public.current_practice_id());

-- Mirrors `letters` (structured JSON sections + meta), scoped to a claim
-- denial instead of a pa_request.
create table claim_appeal_letters (
  id uuid primary key default gen_random_uuid(),
  claim_denial_id uuid not null references claim_denials(id) on delete cascade,
  content text not null,
  sections jsonb,
  meta jsonb,
  version int not null default 1,
  model text,
  approved_at timestamptz,
  approved_by uuid,
  created_at timestamptz not null default now()
);

alter table claim_appeal_letters enable row level security;

create policy "claim_appeal_letters_select_practice" on claim_appeal_letters
  for select using (
    exists (
      select 1 from claim_denials d
      where d.id = claim_appeal_letters.claim_denial_id
      and (d.practice_id = public.current_practice_id() or public.current_role() = 'super_admin')
    )
  );

create policy "claim_appeal_letters_insert_practice" on claim_appeal_letters
  for insert with check (
    exists (
      select 1 from claim_denials d
      where d.id = claim_appeal_letters.claim_denial_id
      and d.practice_id = public.current_practice_id()
    )
  );

create policy "claim_appeal_letters_update_practice" on claim_appeal_letters
  for update using (
    exists (
      select 1 from claim_denials d
      where d.id = claim_appeal_letters.claim_denial_id
      and d.practice_id = public.current_practice_id()
    )
  );
