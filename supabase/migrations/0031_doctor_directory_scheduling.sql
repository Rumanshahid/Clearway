-- Public doctor directory + AI-assisted appointment scheduling.
--
-- A practice's clinicians can opt in (public_enabled) to a public profile at
-- /doctors/[slug]. Patients book through a slot picker / AI intake without an
-- account; all patient-facing writes go through server actions running under
-- the service-role client (see src/lib/supabase/server.ts createAdminClient),
-- the same pattern already used by the cron jobs -- so there is no anon-role
-- insert policy on appointments/waitlist/reviews. Staff-side reads/writes use
-- the normal practice_id RLS policies below.
--
-- Double-booking is prevented at the database level (not just app logic) via
-- a GiST exclusion constraint on doctor_profile_id + time range, so two
-- concurrent booking attempts for the same slot can't both succeed.

create extension if not exists btree_gist;

-- ─────────────────────────────────────────────────────────────
-- doctor_profiles — one public listing per clinician who opts in
-- ─────────────────────────────────────────────────────────────
create table doctor_profiles (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  profile_id uuid not null unique references profiles(id) on delete cascade,

  public_enabled boolean not null default false,
  slug text not null unique,

  credentials text, -- e.g. "MD, FAAOS"
  specialty text,
  sub_specialties text[] not null default '{}',
  photo_url text,
  bio text,
  languages text[] not null default '{}',
  insurance_accepted text[] not null default '{}',
  conditions_treated text[] not null default '{}',
  accepting_new_patients boolean not null default true,
  telehealth_available boolean not null default false,

  timezone text not null default 'America/New_York', -- IANA name; all doctor_availability/blackout_dates times are wall-clock in this zone
  min_notice_hours int not null default 24 check (min_notice_hours >= 0),
  max_advance_days int not null default 90 check (max_advance_days > 0),
  max_appointments_per_day int, -- null = unlimited

  address_line1 text,
  city text,
  state text,
  zip text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index doctor_profiles_practice_id_idx on doctor_profiles(practice_id);
create index doctor_profiles_public_enabled_idx on doctor_profiles(public_enabled) where public_enabled = true;

alter table doctor_profiles enable row level security;

create policy "doctor_profiles_select_practice" on doctor_profiles
  for select using (practice_id = public.current_practice_id() or public.current_role() = 'super_admin');
create policy "doctor_profiles_select_public" on doctor_profiles
  for select using (public_enabled = true);
create policy "doctor_profiles_insert_practice" on doctor_profiles
  for insert with check (practice_id = public.current_practice_id());
create policy "doctor_profiles_update_practice" on doctor_profiles
  for update using (practice_id = public.current_practice_id());
create policy "doctor_profiles_delete_practice" on doctor_profiles
  for delete using (practice_id = public.current_practice_id());

-- ─────────────────────────────────────────────────────────────
-- doctor_availability — recurring weekly working blocks (multiple per day allowed)
-- ─────────────────────────────────────────────────────────────
create table doctor_availability (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  doctor_profile_id uuid not null references doctor_profiles(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6), -- 0 = Sunday
  start_time time not null,
  end_time time not null,
  check (end_time > start_time)
);

create index doctor_availability_doctor_idx on doctor_availability(doctor_profile_id);

alter table doctor_availability enable row level security;

create policy "doctor_availability_select_practice" on doctor_availability
  for select using (practice_id = public.current_practice_id() or public.current_role() = 'super_admin');
create policy "doctor_availability_select_public" on doctor_availability
  for select using (exists (select 1 from doctor_profiles d where d.id = doctor_availability.doctor_profile_id and d.public_enabled = true));
create policy "doctor_availability_insert_practice" on doctor_availability
  for insert with check (practice_id = public.current_practice_id());
create policy "doctor_availability_update_practice" on doctor_availability
  for update using (practice_id = public.current_practice_id());
create policy "doctor_availability_delete_practice" on doctor_availability
  for delete using (practice_id = public.current_practice_id());

-- ─────────────────────────────────────────────────────────────
-- appointment_types — New Patient / Follow-up / Urgent / Telehealth, each with its own duration
-- ─────────────────────────────────────────────────────────────
create table appointment_types (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  doctor_profile_id uuid not null references doctor_profiles(id) on delete cascade,
  name text not null,
  duration_minutes int not null check (duration_minutes > 0),
  buffer_minutes int not null default 0 check (buffer_minutes >= 0),
  is_telehealth boolean not null default false,
  is_new_patient boolean not null default false,
  active boolean not null default true,
  sort_order int not null default 0
);

create index appointment_types_doctor_idx on appointment_types(doctor_profile_id);

alter table appointment_types enable row level security;

create policy "appointment_types_select_practice" on appointment_types
  for select using (practice_id = public.current_practice_id() or public.current_role() = 'super_admin');
create policy "appointment_types_select_public" on appointment_types
  for select using (active = true and exists (select 1 from doctor_profiles d where d.id = appointment_types.doctor_profile_id and d.public_enabled = true));
create policy "appointment_types_insert_practice" on appointment_types
  for insert with check (practice_id = public.current_practice_id());
create policy "appointment_types_update_practice" on appointment_types
  for update using (practice_id = public.current_practice_id());
create policy "appointment_types_delete_practice" on appointment_types
  for delete using (practice_id = public.current_practice_id());

-- ─────────────────────────────────────────────────────────────
-- blackout_dates — whole-day (or partial-day) availability overrides
-- ─────────────────────────────────────────────────────────────
create table blackout_dates (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  doctor_profile_id uuid not null references doctor_profiles(id) on delete cascade,
  date date not null,
  start_time time, -- null + null start/end = whole day blocked
  end_time time,
  reason text
);

create index blackout_dates_doctor_idx on blackout_dates(doctor_profile_id, date);

alter table blackout_dates enable row level security;

create policy "blackout_dates_select_practice" on blackout_dates
  for select using (practice_id = public.current_practice_id() or public.current_role() = 'super_admin');
create policy "blackout_dates_select_public" on blackout_dates
  for select using (exists (select 1 from doctor_profiles d where d.id = blackout_dates.doctor_profile_id and d.public_enabled = true));
create policy "blackout_dates_insert_practice" on blackout_dates
  for insert with check (practice_id = public.current_practice_id());
create policy "blackout_dates_update_practice" on blackout_dates
  for update using (practice_id = public.current_practice_id());
create policy "blackout_dates_delete_practice" on blackout_dates
  for delete using (practice_id = public.current_practice_id());

-- ─────────────────────────────────────────────────────────────
-- intake_questions — AI booking-flow questions, doctor-editable text over a
-- fixed set of semantic keys (question_key) the routing logic understands,
-- plus freeform custom questions (question_key null) collected as notes only.
-- ─────────────────────────────────────────────────────────────
create table intake_questions (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  doctor_profile_id uuid not null references doctor_profiles(id) on delete cascade,
  question_key text check (question_key in ('reason', 'duration_since', 'new_or_returning', 'referral', 'urgent', 'insurance')),
  question_text text not null,
  sort_order int not null default 0,
  active boolean not null default true
);

create index intake_questions_doctor_idx on intake_questions(doctor_profile_id);

alter table intake_questions enable row level security;

create policy "intake_questions_select_practice" on intake_questions
  for select using (practice_id = public.current_practice_id() or public.current_role() = 'super_admin');
create policy "intake_questions_select_public" on intake_questions
  for select using (active = true and exists (select 1 from doctor_profiles d where d.id = intake_questions.doctor_profile_id and d.public_enabled = true));
create policy "intake_questions_insert_practice" on intake_questions
  for insert with check (practice_id = public.current_practice_id());
create policy "intake_questions_update_practice" on intake_questions
  for update using (practice_id = public.current_practice_id());
create policy "intake_questions_delete_practice" on intake_questions
  for delete using (practice_id = public.current_practice_id());

-- ─────────────────────────────────────────────────────────────
-- notification_prefs — one row per doctor profile
-- ─────────────────────────────────────────────────────────────
create table notification_prefs (
  doctor_profile_id uuid primary key references doctor_profiles(id) on delete cascade,
  practice_id uuid not null references practices(id) on delete cascade,
  email_new_booking boolean not null default true,
  sms_new_booking boolean not null default false,
  daily_summary_email boolean not null default false,
  reminder_24h boolean not null default true,
  reminder_2h boolean not null default false,
  cancellation_policy_hours int not null default 24 check (cancellation_policy_hours >= 0)
);

alter table notification_prefs enable row level security;

create policy "notification_prefs_select_practice" on notification_prefs
  for select using (practice_id = public.current_practice_id() or public.current_role() = 'super_admin');
create policy "notification_prefs_select_public" on notification_prefs
  for select using (exists (select 1 from doctor_profiles d where d.id = notification_prefs.doctor_profile_id and d.public_enabled = true));
create policy "notification_prefs_insert_practice" on notification_prefs
  for insert with check (practice_id = public.current_practice_id());
create policy "notification_prefs_update_practice" on notification_prefs
  for update using (practice_id = public.current_practice_id());

-- ─────────────────────────────────────────────────────────────
-- appointments — the core booking record. Patient-facing writes happen via a
-- service-role server action (no anon RLS policy needed); staff read/manage
-- through the practice-scoped policies below.
-- ─────────────────────────────────────────────────────────────
create table appointments (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  doctor_profile_id uuid not null references doctor_profiles(id) on delete cascade,
  appointment_type_id uuid not null references appointment_types(id),
  patient_id uuid references patients(id) on delete set null, -- set once staff link/create a patient record

  patient_full_name text not null,
  patient_dob date,
  patient_phone text not null,
  patient_email text not null,
  patient_insurance_company text,
  patient_member_id text,
  patient_notes text,
  -- Populated by an eligibility-check integration (e.g. Availity) if one is
  -- configured; null when no check has run. See src/lib/insurance-eligibility.ts.
  insurance_verification_status text check (insurance_verification_status in ('verified', 'not_verified', 'unavailable')),

  is_new_patient boolean not null default false,
  is_telehealth boolean not null default false,
  telehealth_room_url text,
  reason_for_visit text,
  intake_answers jsonb not null default '{}',

  start_at timestamptz not null,
  end_at timestamptz not null,
  time_range tstzrange generated always as (tstzrange(start_at, end_at, '[)')) stored,

  status text not null default 'confirmed' check (status in ('confirmed', 'checked_in', 'complete', 'no_show', 'cancelled')),
  cancelled_at timestamptz,
  cancelled_reason text,

  thank_you_draft text, -- AI-drafted on Mark Complete; doctor reviews/edits before it sends
  thank_you_sent_at timestamptz,

  -- Set once a reminder has gone out so the (frequent) reminder cron can use
  -- a simple "is null and within the window" query instead of depending on
  -- exact-minute cron timing to avoid double-sends.
  reminder_24h_sent_at timestamptz,
  reminder_2h_sent_at timestamptz,
  review_requested_at timestamptz,

  created_at timestamptz not null default now(),
  check (end_at > start_at),
  exclude using gist (doctor_profile_id with =, time_range with &&) where (status <> 'cancelled')
);

create index appointments_practice_idx on appointments(practice_id, start_at);
create index appointments_doctor_idx on appointments(doctor_profile_id, start_at);
create index appointments_patient_idx on appointments(patient_id);

alter table appointments enable row level security;

create policy "appointments_select_practice" on appointments
  for select using (practice_id = public.current_practice_id() or public.current_role() = 'super_admin');
create policy "appointments_update_practice" on appointments
  for update using (practice_id = public.current_practice_id());

-- ─────────────────────────────────────────────────────────────
-- waitlist — FIFO per doctor/appointment type; offered a slot when one frees up
-- ─────────────────────────────────────────────────────────────
create table waitlist (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  doctor_profile_id uuid not null references doctor_profiles(id) on delete cascade,
  appointment_type_id uuid not null references appointment_types(id),

  patient_full_name text not null,
  patient_phone text not null,
  patient_email text not null,

  status text not null default 'waiting' check (status in ('waiting', 'offered', 'booked', 'expired', 'cancelled')),
  offered_at timestamptz,
  offer_expires_at timestamptz,
  offered_start_at timestamptz, -- the specific freed slot offered, so a later reschedule of the type's hours doesn't retroactively change what was promised
  offered_end_at timestamptz,
  created_at timestamptz not null default now()
);

create index waitlist_doctor_idx on waitlist(doctor_profile_id, status, created_at);

alter table waitlist enable row level security;

create policy "waitlist_select_practice" on waitlist
  for select using (practice_id = public.current_practice_id() or public.current_role() = 'super_admin');
create policy "waitlist_update_practice" on waitlist
  for update using (practice_id = public.current_practice_id());

-- ─────────────────────────────────────────────────────────────
-- reviews — post-visit rating, publicly visible on the doctor profile once published
-- ─────────────────────────────────────────────────────────────
create table reviews (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  doctor_profile_id uuid not null references doctor_profiles(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete set null,

  rating int not null check (rating between 1 and 5),
  comment text,
  patient_display_name text, -- e.g. "Sarah M." -- never the full patient record

  published boolean not null default true,
  created_at timestamptz not null default now()
);

create index reviews_doctor_idx on reviews(doctor_profile_id, published);

alter table reviews enable row level security;

create policy "reviews_select_practice" on reviews
  for select using (practice_id = public.current_practice_id() or public.current_role() = 'super_admin');
create policy "reviews_select_public" on reviews
  for select using (published = true and exists (select 1 from doctor_profiles d where d.id = reviews.doctor_profile_id and d.public_enabled = true));
create policy "reviews_update_practice" on reviews
  for update using (practice_id = public.current_practice_id());
create policy "reviews_delete_practice" on reviews
  for delete using (practice_id = public.current_practice_id());

-- ─────────────────────────────────────────────────────────────
-- pre_appointment_intake — patient-submitted intake form ahead of a visit
-- ─────────────────────────────────────────────────────────────
create table pre_appointment_intake (
  appointment_id uuid primary key references appointments(id) on delete cascade,
  practice_id uuid not null references practices(id) on delete cascade,
  symptoms text,
  medical_history text,
  current_medications text,
  submitted_at timestamptz not null default now()
);

alter table pre_appointment_intake enable row level security;

create policy "pre_appointment_intake_select_practice" on pre_appointment_intake
  for select using (practice_id = public.current_practice_id() or public.current_role() = 'super_admin');
