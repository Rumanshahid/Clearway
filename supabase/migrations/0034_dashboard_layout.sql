-- Per-user customizable widget order/visibility for the Overview dashboard.
-- Null means "use the default layout" -- nothing to backfill.
alter table profiles add column if not exists dashboard_layout jsonb;
