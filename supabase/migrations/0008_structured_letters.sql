-- Structured letter output: Claude now returns 8 labeled sections + a meta
-- block (approach used, red flags identified, soft warnings, denial risk)
-- instead of one plain-text blob. `content` is kept as a flattened synthesis
-- of the sections (used by PDF generation, email snippets, and as a fallback
-- for any letter generated before this migration).

alter table pa_requests add column if not exists member_id text;
alter table pa_requests add column if not exists cpt_code text;

alter table letters add column if not exists sections jsonb;
alter table letters add column if not exists meta jsonb;
