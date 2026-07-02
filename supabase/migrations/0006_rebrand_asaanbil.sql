-- Rebrand: update already-seeded content rows that were created before the
-- switch from "Clearway" to "asaanbil.com". Safe to re-run — no-ops once done.

update prompt_templates
set content = replace(content, 'Clearway', 'asaanbil.com')
where content like '%Clearway%';

update site_content
set value = replace(value, 'Clearway', 'asaanbil.com')
where value like '%Clearway%';
