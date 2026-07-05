-- Free-text job title for a team member (e.g. "Front Desk Coordinator",
-- "Billing Specialist", "Nurse") — separate from role, which still controls
-- permissions. A doctor can label staff however their practice actually
-- refers to them without it affecting what they can access.

alter table profiles add column if not exists title text;
alter table invites add column if not exists title text;
