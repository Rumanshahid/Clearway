-- Adds NPI and fax to doctor_profiles so a practice's own staff doctors
-- carry enough data (alongside the existing credentials/specialty columns)
-- to be selected as the ordering physician on a PA request, the same way
-- an external entry in the physicians table already can.
alter table doctor_profiles add column if not exists npi text;
alter table doctor_profiles add column if not exists fax text;
