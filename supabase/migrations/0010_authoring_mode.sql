-- Doctor-authored vs. patient-authored letters. Practices set a default at
-- onboarding; each request can override it (a clinic occasionally helps a
-- patient self-file an appeal even though most of their letters are
-- doctor-authored).

alter table practices add column if not exists default_authoring_mode text not null default 'doctor'
  check (default_authoring_mode in ('doctor', 'patient'));

alter table pa_requests add column if not exists authoring_mode text not null default 'doctor'
  check (authoring_mode in ('doctor', 'patient'));
