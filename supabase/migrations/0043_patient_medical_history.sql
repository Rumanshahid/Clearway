-- Free-text medical history, shown as its own dashboard section distinct
-- from allergies/medications (already on patient_profiles) and insurance.
alter table patient_profiles add column if not exists medical_history text;
