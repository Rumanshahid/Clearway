-- Which dashboard sections the patient has hidden via the Customize
-- button, mirroring the staff dashboard's widget-visibility pattern
-- (dashboardWidgets.ts) but with a fixed section list rather than a
-- reorderable widget registry -- the patient dashboard's sections aren't
-- meaningfully reorderable the way staff's drafting/tasks/appointments
-- panels are.
alter table patient_accounts add column if not exists dashboard_hidden_sections text[] not null default '{}';
