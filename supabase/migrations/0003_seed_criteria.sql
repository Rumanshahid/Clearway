-- Clearway — seed criteria table from src/lib/criteria.ts (Phase 1 static data).
-- Generated once during the Phase 2/3 migration; from here on, edit rows via the
-- admin panel (or this table directly), not the TS file.

insert into criteria (key, label, required_fields, red_flags, aetna, evicore, sources, prompt_notes, enabled)
values (
  'lumbar_spine_mri',
  'Lumbar Spine MRI',
  '[{"key":"symptom_duration","label":"Symptom duration","type":"text","required":true},{"key":"pain_type","label":"Pain type","type":"select","required":true,"options":["Axial (back only)","Radicular (radiating down leg)"]},{"key":"exam_findings","label":"Objective exam findings","type":"textarea","required":true,"helpText":"Straight leg raise, reflexes, motor strength grading, sensory deficits"},{"key":"conservative_treatment","label":"Conservative treatment tried (type, duration, outcome)","type":"textarea","required":true,"helpText":"e.g. NSAIDs 6 weeks + PT 6 weeks, minimal improvement"},{"key":"intended_use","label":"Intended use of MRI result","type":"text","required":true,"helpText":"e.g. pre-epidural-injection planning, surgical planning, malignancy follow-up"}]'::jsonb,
  '["Progressive motor weakness","Bowel/bladder dysfunction (possible cauda equina)","Suspected malignancy or infection (e.g. osteomyelitis)","Significant trauma","Severe pain requiring hospitalization, or progressing despite conservative management"]'::jsonb,
  'Requires documented red-flag symptoms, OR a failed ~6-week trial of conservative treatment, before approving imaging for routine low back pain. Also necessary pre-epidural-injection (rule out tumor/infection, plan injection site) or for known/suspected spinal malignancy follow-up. Chronic mechanical low back pain without radiculopathy, neurologic deficit, trauma, or systemic disease suspicion generally does not meet necessity unless pain is severe or progressing despite treatment.',
  'Distinguishes ''low back pain without neurological features'' (stricter — needs a documented conservative-care trial first) from ''lower extremity pain WITH neurological features'' (radiculopathy, radiculitis, plexopathy, neuropathy) which can justify imaging sooner on exam findings alone. Surgical planning and contrast-enhanced MRI are evaluated on a separate track.',
  'Aetna CPB #0236 (MRI/CT of the Spine). eviCore Spine Imaging Guidelines, eff. Feb 2025.',
  'If red flags are present, lead the letter with them — they short-circuit the conservative-care requirement entirely. If absent, explicitly state conservative treatment type, duration, and outcome; missing that documentation is the #1 denial reason.',
  true
)
on conflict (key) do nothing;

insert into criteria (key, label, required_fields, red_flags, aetna, evicore, sources, prompt_notes, enabled)
values (
  'cervical_spine_mri',
  'Cervical Spine MRI',
  '[{"key":"symptom_character","label":"Symptom duration and character","type":"text","required":true,"helpText":"Axial neck pain vs. radicular/arm symptoms"},{"key":"exam_findings","label":"Objective findings","type":"textarea","required":true,"helpText":"Motor/sensory deficits, reflex changes, Spurling''s test result"},{"key":"trauma_history","label":"History of trauma (if any) and prior CT findings","type":"textarea","required":false},{"key":"conservative_treatment","label":"Conservative treatment tried and outcome","type":"textarea","required":true}]'::jsonb,
  '["Progressive or acute neurological deficit (motor/sensory)","Suspected myelopathy or cord compression","Trauma with neurological signs","Suspected infection or malignancy"]'::jsonb,
  'Covers cervical alongside lumbar under the same CPB. MRI is not necessary for further evaluation of unstable injury in neurologically intact trauma patients after a negative cervical CT, nor routine MRI after a normal CT in obtunded/comatose patients. Outside trauma, the same red-flag-or-failed-conservative-care logic as lumbar applies.',
  'Separates ''neck pain without/with neurological features (including stenosis) and trauma'' with criteria mirroring the lumbar approach — neurological exam findings accelerate approval; axial-only pain needs a documented conservative-care trial first.',
  'Aetna CPB #0236 (spine, general). eviCore Spine Imaging Guidelines, section SP-3.',
  'Distinguish trauma vs. non-trauma cases early — Aetna''s criteria diverge significantly between the two.',
  true
)
on conflict (key) do nothing;

insert into criteria (key, label, required_fields, red_flags, aetna, evicore, sources, prompt_notes, enabled)
values (
  'knee_mri',
  'Knee MRI',
  '[{"key":"symptom_mechanism","label":"Symptom duration and mechanism","type":"text","required":true,"helpText":"Acute trauma vs. chronic/degenerative"},{"key":"exam_findings","label":"Objective exam","type":"textarea","required":true,"helpText":"Effusion, joint line tenderness, McMurray test, instability testing, ROM"},{"key":"conservative_treatment","label":"Conservative treatment tried (type, duration, outcome)","type":"textarea","required":true,"helpText":"PT, NSAIDs, activity modification, bracing"},{"key":"prior_imaging","label":"Prior imaging already done","type":"text","required":true,"helpText":"X-ray results — almost always required first"}]'::jsonb,
  '["Locked knee / mechanical block","Suspected fracture not clear on X-ray","Signs of joint infection (fever, warmth, severe effusion)","Acute ligamentous instability immediately after trauma","Suspected tumor"]'::jsonb,
  'Medically necessary for: tumor detection/staging/post-treatment evaluation; OR persistent knee pain/swelling/instability not associated with injury, not responding to at least 3 weeks of conservative therapy; OR the same secondary to an injury where X-rays already ruled out fracture/loose body and the picture remains uncertain; OR persistent true locking suggesting a torn meniscus or loose body. Conservative therapy = rest, ice, compression, elevation, NSAIDs, crutches, ROM exercises.',
  'Distinguishes acute trauma (faster approval — fracture/dislocation concern) from chronic pain workups (more conservative-care documentation required, mirroring the back-pain pattern unless red flags are present).',
  'Aetna CPB #0171 (MRI of the Extremities). eviCore Musculoskeletal Imaging Guidelines, eff. Feb 2025.',
  'Aetna''s 3-week conservative-care threshold for knee is shorter than the ~6 weeks for lumbar spine — don''t reuse duration assumptions across procedures. Always confirm an X-ray was done first; its absence is a common, avoidable denial reason.',
  true
)
on conflict (key) do nothing;

insert into criteria (key, label, required_fields, red_flags, aetna, evicore, sources, prompt_notes, enabled)
values (
  'shoulder_mri',
  'Shoulder MRI',
  '[{"key":"symptom_mechanism","label":"Symptom duration and mechanism","type":"text","required":true,"helpText":"Acute injury vs. chronic/overuse"},{"key":"exam_findings","label":"Objective exam","type":"textarea","required":true,"helpText":"Impingement signs, rotator cuff strength testing, ROM, instability testing"},{"key":"conservative_treatment","label":"Conservative treatment tried (type, duration, outcome)","type":"textarea","required":true,"helpText":"PT, NSAIDs, injections"},{"key":"prior_imaging","label":"Prior imaging (X-ray) results","type":"text","required":true},{"key":"surgical_candidate","label":"Being considered for surgery?","type":"select","required":true,"options":["Yes","No"]}]'::jsonb,
  '["Suspected acute, full-thickness rotator cuff tear in an active/working-age patient","Suspected fracture or dislocation","Signs of infection","Significant acute instability after trauma"]'::jsonb,
  'Same CPB (#0171) framework as knee: necessary for tumor evaluation, or for persistent pain/instability not responding to conservative therapy, with X-ray having ruled out fracture/bony pathology first when trauma is involved. Rotator cuff pathology is evaluated against documented conservative care (rest, NSAIDs, PT, injections) before advanced imaging for non-urgent cases.',
  'Similar logic to knee — acute trauma with suspected fracture/dislocation moves faster; chronic pain workups need conservative-care documentation first.',
  'Aetna CPB #0171. eviCore Musculoskeletal Imaging Guidelines.',
  'Flag whether the patient is being considered for surgery — both payers move faster on imaging when a surgical decision is time-sensitive (e.g. young patient, acute full-thickness tear) versus a routine chronic-pain workup.',
  true
)
on conflict (key) do nothing;

insert into criteria (key, label, required_fields, red_flags, aetna, evicore, sources, prompt_notes, enabled)
values (
  'brain_mri',
  'Brain MRI',
  '[{"key":"symptom_history","label":"Headache/symptom history","type":"textarea","required":true,"helpText":"Onset, duration, change in pattern/frequency/intensity"},{"key":"patient_age","label":"Patient age","type":"number","required":true,"helpText":"New-onset headache after 50 is an independent red flag"},{"key":"associated_symptoms","label":"Associated symptoms","type":"textarea","required":false,"helpText":"Fever, neck stiffness, focal neuro deficits, vision changes, seizures"},{"key":"posture_symptoms","label":"Posture-related symptom changes","type":"text","required":false,"helpText":"Worse lying down vs. standing"},{"key":"triggers","label":"Triggers","type":"text","required":false,"helpText":"Cough, exertion, sexual activity"},{"key":"clinical_question","label":"Clinical question being answered","type":"select","required":true,"options":["Tumor surveillance/follow-up","New symptom workup","Seizure workup","Other"]}]'::jsonb,
  '["New-onset headache in a patient over 50","Progressive change in headache pattern/frequency/intensity not responding to previously effective treatment","Transformation from episodic to chronic headache (>15 days/month for over 3 months)","Fever + neck stiffness + headache (possible meningitis/subarachnoid hemorrhage — urgent, not routine PA)","Posture-dependent headache","Headache triggered by cough, exertion, or sexual activity","Focal neurological deficit, seizure, or altered consciousness"]'::jsonb,
  'No single consolidated ''brain MRI'' bulletin — necessity is evaluated per clinical indication (fMRI pre-surgical planning under CPB #0739; MRA/MRV vascular indications under CPB #0094; PET-related brain indications under CPB #0071). For headache specifically, Aetna does not consider MRA necessary for routine workup of non-specific, non-focal symptoms absent red flags or focal findings.',
  'No dedicated section captured yet for brain MRI beyond general red-flag-based neuroimaging standards.',
  'Aetna CPB #0739 (fMRI), CPB #0094 (MRA/MRV), CPB #0071 (PET); general red-flag criteria from headache-specialty literature, not one dedicated CPB.',
  'There is no single clean bulletin for brain MRI necessity — route by the specific clinical question (tumor surveillance? new headache workup? seizure workup?) rather than treating it as one generic procedure. State this limitation plainly if the case doesn''t clearly match a red flag or a specific CPB indication.',
  true
)
on conflict (key) do nothing;

insert into criteria (key, label, required_fields, red_flags, aetna, evicore, sources, prompt_notes, enabled)
values (
  'ct_abdomen_pelvis',
  'CT Abdomen/Pelvis (with contrast)',
  '[{"key":"clinical_indication","label":"Clinical indication","type":"select","required":true,"options":["Acute abdominal pain workup","Oncology staging/surveillance","Other"]},{"key":"symptom_character","label":"Symptom duration and character (if acute pain workup)","type":"textarea","required":false},{"key":"renal_function","label":"Relevant lab results (e.g. renal function)","type":"text","required":true,"helpText":"Affects contrast eligibility"},{"key":"malignancy_details","label":"Known/suspected malignancy details (if oncology-related)","type":"textarea","required":false},{"key":"prior_imaging","label":"Prior imaging already performed","type":"text","required":false}]'::jsonb,
  '["Acute severe abdominal pain with signs of obstruction, perforation, or vascular emergency (typically ER/inpatient — not a PA scenario)","Known malignancy requiring staging or surveillance per treatment protocol","Severe renal insufficiency (eGFR <30) — contrast contraindication in some cases"]'::jsonb,
  'No general ''CT abdomen/pelvis'' bulletin — necessity is diagnosis-driven, most often oncology staging/surveillance (see PET section) or acute abdominal symptom workup, which follows standard CPT-code-specific precertification lookup rather than a single named bulletin.',
  'No single dedicated bulletin found for this procedure broadly; necessity is diagnosis-driven.',
  'No dedicated Aetna/eviCore bulletin. Contrast safety thresholds from ACR Manual on Contrast Media.',
  'This category is less standardized than joint or spine imaging. Ask for the underlying diagnosis/reason for the scan first, then justify against that diagnosis''s standard workup rather than a universal criterion.',
  true
)
on conflict (key) do nothing;

insert into criteria (key, label, required_fields, red_flags, aetna, evicore, sources, prompt_notes, enabled)
values (
  'ct_chest',
  'CT Chest (with contrast)',
  '[{"key":"clinical_indication","label":"Clinical indication","type":"select","required":true,"options":["Pulmonary nodule follow-up","Oncology staging","Suspected PE","Other"]},{"key":"symptom_history","label":"Symptom history (if acute)","type":"textarea","required":false,"helpText":"Chest pain, shortness of breath, hemoptysis"},{"key":"prior_imaging","label":"Prior chest imaging (X-ray) findings","type":"text","required":false},{"key":"malignancy_details","label":"Known/suspected malignancy details (if oncology-related)","type":"textarea","required":false},{"key":"renal_function","label":"Renal function (contrast eligibility)","type":"text","required":true},{"key":"nodule_details","label":"Nodule size and growth interval (if nodule follow-up)","type":"text","required":false,"helpText":"Reference Fleischner Society criteria"}]'::jsonb,
  '["Suspected pulmonary embolism with acute symptoms (often urgent/ER pathway)","Known malignancy requiring staging per treatment protocol","Indeterminate pulmonary nodule meeting size/growth criteria for further workup"]'::jsonb,
  'No stand-alone ''CT chest'' bulletin — evaluated against the underlying indication: oncology staging follows cancer-specific protocols; pulmonary nodule follow-up follows radiology society guidelines (Fleischner Society criteria); acute symptom workups go through standard precertification.',
  'No single dedicated bulletin found broadly; necessity is diagnosis-driven.',
  'No dedicated Aetna/eviCore bulletin. Fleischner Society criteria are the de facto standard for nodule follow-up.',
  'Same approach as CT abdomen/pelvis: ask for the underlying diagnosis/reason first. For nodule follow-up specifically, reference nodule size and growth interval explicitly — insurers expect Fleischner Society criteria even though Aetna doesn''t publish its own restated bulletin.',
  true
)
on conflict (key) do nothing;

insert into criteria (key, label, required_fields, red_flags, aetna, evicore, sources, prompt_notes, enabled)
values (
  'pet_scan',
  'PET Scan (PET/CT)',
  '[{"key":"cancer_type_stage","label":"Cancer type and stage (if oncology-related)","type":"text","required":true},{"key":"purpose","label":"Purpose","type":"select","required":true,"options":["Initial staging","Treatment response assessment","Surveillance","Recurrence workup"]},{"key":"prior_imaging","label":"Prior imaging already performed (CT, MRI) and findings","type":"textarea","required":true},{"key":"non_oncology_indication","label":"Non-oncology indication, if applicable","type":"text","required":false,"helpText":"e.g. cardiac viability, certain neurological conditions"}]'::jsonb,
  '["None generally applicable — PET necessity is driven entirely by matching the specific diagnosis to Aetna''s per-condition list in CPB #0071, not by red-flag override logic."]'::jsonb,
  'The most condition-specific bulletin of all procedures here (CPB #0071) — necessity is established per specific diagnosis (numerous cancer types, each with its own listed indication), not a general ''PET scan'' criterion. Aetna explicitly does NOT consider PET necessary for several specific conditions where evidence is lacking.',
  'Not separately captured; defer to Aetna CPB #0071 diagnosis list as the working reference.',
  'Aetna CPB #0071 (Positron Emission Tomography).',
  'This procedure needs the most diagnosis-specific lookup — a generic justification template will not work well. Confirm the cancer type/diagnosis is explicitly listed in Aetna''s CPB #0071 indications before drafting; flag to staff if it''s not listed (likely denial risk).',
  true
)
on conflict (key) do nothing;

-- procedure x payer toggles -- all enabled by default, matching Phase 1 behavior
insert into procedure_payer_toggles (procedure_key, payer_key, enabled) values ('lumbar_spine_mri', 'aetna', true) on conflict do nothing;
insert into procedure_payer_toggles (procedure_key, payer_key, enabled) values ('lumbar_spine_mri', 'cigna_evicore', true) on conflict do nothing;
insert into procedure_payer_toggles (procedure_key, payer_key, enabled) values ('lumbar_spine_mri', 'other', true) on conflict do nothing;
insert into procedure_payer_toggles (procedure_key, payer_key, enabled) values ('cervical_spine_mri', 'aetna', true) on conflict do nothing;
insert into procedure_payer_toggles (procedure_key, payer_key, enabled) values ('cervical_spine_mri', 'cigna_evicore', true) on conflict do nothing;
insert into procedure_payer_toggles (procedure_key, payer_key, enabled) values ('cervical_spine_mri', 'other', true) on conflict do nothing;
insert into procedure_payer_toggles (procedure_key, payer_key, enabled) values ('knee_mri', 'aetna', true) on conflict do nothing;
insert into procedure_payer_toggles (procedure_key, payer_key, enabled) values ('knee_mri', 'cigna_evicore', true) on conflict do nothing;
insert into procedure_payer_toggles (procedure_key, payer_key, enabled) values ('knee_mri', 'other', true) on conflict do nothing;
insert into procedure_payer_toggles (procedure_key, payer_key, enabled) values ('shoulder_mri', 'aetna', true) on conflict do nothing;
insert into procedure_payer_toggles (procedure_key, payer_key, enabled) values ('shoulder_mri', 'cigna_evicore', true) on conflict do nothing;
insert into procedure_payer_toggles (procedure_key, payer_key, enabled) values ('shoulder_mri', 'other', true) on conflict do nothing;
insert into procedure_payer_toggles (procedure_key, payer_key, enabled) values ('brain_mri', 'aetna', true) on conflict do nothing;
insert into procedure_payer_toggles (procedure_key, payer_key, enabled) values ('brain_mri', 'cigna_evicore', true) on conflict do nothing;
insert into procedure_payer_toggles (procedure_key, payer_key, enabled) values ('brain_mri', 'other', true) on conflict do nothing;
insert into procedure_payer_toggles (procedure_key, payer_key, enabled) values ('ct_abdomen_pelvis', 'aetna', true) on conflict do nothing;
insert into procedure_payer_toggles (procedure_key, payer_key, enabled) values ('ct_abdomen_pelvis', 'cigna_evicore', true) on conflict do nothing;
insert into procedure_payer_toggles (procedure_key, payer_key, enabled) values ('ct_abdomen_pelvis', 'other', true) on conflict do nothing;
insert into procedure_payer_toggles (procedure_key, payer_key, enabled) values ('ct_chest', 'aetna', true) on conflict do nothing;
insert into procedure_payer_toggles (procedure_key, payer_key, enabled) values ('ct_chest', 'cigna_evicore', true) on conflict do nothing;
insert into procedure_payer_toggles (procedure_key, payer_key, enabled) values ('ct_chest', 'other', true) on conflict do nothing;
insert into procedure_payer_toggles (procedure_key, payer_key, enabled) values ('pet_scan', 'aetna', true) on conflict do nothing;
insert into procedure_payer_toggles (procedure_key, payer_key, enabled) values ('pet_scan', 'cigna_evicore', true) on conflict do nothing;
insert into procedure_payer_toggles (procedure_key, payer_key, enabled) values ('pet_scan', 'other', true) on conflict do nothing;
