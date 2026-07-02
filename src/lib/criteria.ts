// Structured version of PA-Criteria-Reference-Imaging-v1.pdf.
//
// As of Phase 2, the `criteria` and `procedure_payer_toggles` DB tables
// (supabase/migrations/0003_seed_criteria.sql seeds them from PROCEDURES
// below) are the runtime source of truth, editable from /admin/criteria
// without a code change. This file now provides: the FieldDef/ProcedureCriteria
// types, the static PAYERS list, and the one-time seed data.
//
// Everything below is paraphrased, not copied verbatim from Aetna's CPBs or
// eviCore's guidelines — keep it that way if this file (or the DB rows it
// seeded) is edited. See the PDF's "Legal Note" section for why that
// distinction matters at scale.

export type PayerKey = "aetna" | "cigna_evicore" | "other";

export const PAYERS: { key: PayerKey; label: string; hasCriteria: boolean }[] = [
  { key: "aetna", label: "Aetna", hasCriteria: true },
  { key: "cigna_evicore", label: "Cigna / eviCore", hasCriteria: true },
  {
    key: "other",
    label: "Other (UHC, Humana, BCBS / Anthem, ...)",
    hasCriteria: false,
  },
];

export type FieldType = "text" | "textarea" | "select" | "checkboxes" | "number";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  helpText?: string;
}

export interface ProcedureCriteria {
  key: string;
  label: string;
  requiredFields: FieldDef[];
  redFlags: string[];
  aetna: string;
  evicore: string;
  sources: string;
  promptNotes: string;
}

export const PROCEDURES: ProcedureCriteria[] = [
  {
    key: "lumbar_spine_mri",
    label: "Lumbar Spine MRI",
    requiredFields: [
      { key: "symptom_duration", label: "Symptom duration", type: "text", required: true },
      {
        key: "pain_type",
        label: "Pain type",
        type: "select",
        required: true,
        options: ["Axial (back only)", "Radicular (radiating down leg)"],
      },
      {
        key: "exam_findings",
        label: "Objective exam findings",
        type: "textarea",
        required: true,
        helpText: "Straight leg raise, reflexes, motor strength grading, sensory deficits",
      },
      {
        key: "conservative_treatment",
        label: "Conservative treatment tried (type, duration, outcome)",
        type: "textarea",
        required: true,
        helpText: "e.g. NSAIDs 6 weeks + PT 6 weeks, minimal improvement",
      },
      {
        key: "intended_use",
        label: "Intended use of MRI result",
        type: "text",
        required: true,
        helpText: "e.g. pre-epidural-injection planning, surgical planning, malignancy follow-up",
      },
    ],
    redFlags: [
      "Progressive motor weakness",
      "Bowel/bladder dysfunction (possible cauda equina)",
      "Suspected malignancy or infection (e.g. osteomyelitis)",
      "Significant trauma",
      "Severe pain requiring hospitalization, or progressing despite conservative management",
    ],
    aetna:
      "Requires documented red-flag symptoms, OR a failed ~6-week trial of conservative treatment, before approving imaging for routine low back pain. Also necessary pre-epidural-injection (rule out tumor/infection, plan injection site) or for known/suspected spinal malignancy follow-up. Chronic mechanical low back pain without radiculopathy, neurologic deficit, trauma, or systemic disease suspicion generally does not meet necessity unless pain is severe or progressing despite treatment.",
    evicore:
      "Distinguishes 'low back pain without neurological features' (stricter — needs a documented conservative-care trial first) from 'lower extremity pain WITH neurological features' (radiculopathy, radiculitis, plexopathy, neuropathy) which can justify imaging sooner on exam findings alone. Surgical planning and contrast-enhanced MRI are evaluated on a separate track.",
    sources: "Aetna CPB #0236 (MRI/CT of the Spine). eviCore Spine Imaging Guidelines, eff. Feb 2025.",
    promptNotes:
      "If red flags are present, lead the letter with them — they short-circuit the conservative-care requirement entirely. If absent, explicitly state conservative treatment type, duration, and outcome; missing that documentation is the #1 denial reason.",
  },
  {
    key: "cervical_spine_mri",
    label: "Cervical Spine MRI",
    requiredFields: [
      {
        key: "symptom_character",
        label: "Symptom duration and character",
        type: "text",
        required: true,
        helpText: "Axial neck pain vs. radicular/arm symptoms",
      },
      {
        key: "exam_findings",
        label: "Objective findings",
        type: "textarea",
        required: true,
        helpText: "Motor/sensory deficits, reflex changes, Spurling's test result",
      },
      { key: "trauma_history", label: "History of trauma (if any) and prior CT findings", type: "textarea", required: false },
      { key: "conservative_treatment", label: "Conservative treatment tried and outcome", type: "textarea", required: true },
    ],
    redFlags: [
      "Progressive or acute neurological deficit (motor/sensory)",
      "Suspected myelopathy or cord compression",
      "Trauma with neurological signs",
      "Suspected infection or malignancy",
    ],
    aetna:
      "Covers cervical alongside lumbar under the same CPB. MRI is not necessary for further evaluation of unstable injury in neurologically intact trauma patients after a negative cervical CT, nor routine MRI after a normal CT in obtunded/comatose patients. Outside trauma, the same red-flag-or-failed-conservative-care logic as lumbar applies.",
    evicore:
      "Separates 'neck pain without/with neurological features (including stenosis) and trauma' with criteria mirroring the lumbar approach — neurological exam findings accelerate approval; axial-only pain needs a documented conservative-care trial first.",
    sources: "Aetna CPB #0236 (spine, general). eviCore Spine Imaging Guidelines, section SP-3.",
    promptNotes:
      "Distinguish trauma vs. non-trauma cases early — Aetna's criteria diverge significantly between the two.",
  },
  {
    key: "knee_mri",
    label: "Knee MRI",
    requiredFields: [
      {
        key: "symptom_mechanism",
        label: "Symptom duration and mechanism",
        type: "text",
        required: true,
        helpText: "Acute trauma vs. chronic/degenerative",
      },
      {
        key: "exam_findings",
        label: "Objective exam",
        type: "textarea",
        required: true,
        helpText: "Effusion, joint line tenderness, McMurray test, instability testing, ROM",
      },
      {
        key: "conservative_treatment",
        label: "Conservative treatment tried (type, duration, outcome)",
        type: "textarea",
        required: true,
        helpText: "PT, NSAIDs, activity modification, bracing",
      },
      {
        key: "prior_imaging",
        label: "Prior imaging already done",
        type: "text",
        required: true,
        helpText: "X-ray results — almost always required first",
      },
    ],
    redFlags: [
      "Locked knee / mechanical block",
      "Suspected fracture not clear on X-ray",
      "Signs of joint infection (fever, warmth, severe effusion)",
      "Acute ligamentous instability immediately after trauma",
      "Suspected tumor",
    ],
    aetna:
      "Medically necessary for: tumor detection/staging/post-treatment evaluation; OR persistent knee pain/swelling/instability not associated with injury, not responding to at least 3 weeks of conservative therapy; OR the same secondary to an injury where X-rays already ruled out fracture/loose body and the picture remains uncertain; OR persistent true locking suggesting a torn meniscus or loose body. Conservative therapy = rest, ice, compression, elevation, NSAIDs, crutches, ROM exercises.",
    evicore:
      "Distinguishes acute trauma (faster approval — fracture/dislocation concern) from chronic pain workups (more conservative-care documentation required, mirroring the back-pain pattern unless red flags are present).",
    sources: "Aetna CPB #0171 (MRI of the Extremities). eviCore Musculoskeletal Imaging Guidelines, eff. Feb 2025.",
    promptNotes:
      "Aetna's 3-week conservative-care threshold for knee is shorter than the ~6 weeks for lumbar spine — don't reuse duration assumptions across procedures. Always confirm an X-ray was done first; its absence is a common, avoidable denial reason.",
  },
  {
    key: "shoulder_mri",
    label: "Shoulder MRI",
    requiredFields: [
      {
        key: "symptom_mechanism",
        label: "Symptom duration and mechanism",
        type: "text",
        required: true,
        helpText: "Acute injury vs. chronic/overuse",
      },
      {
        key: "exam_findings",
        label: "Objective exam",
        type: "textarea",
        required: true,
        helpText: "Impingement signs, rotator cuff strength testing, ROM, instability testing",
      },
      {
        key: "conservative_treatment",
        label: "Conservative treatment tried (type, duration, outcome)",
        type: "textarea",
        required: true,
        helpText: "PT, NSAIDs, injections",
      },
      { key: "prior_imaging", label: "Prior imaging (X-ray) results", type: "text", required: true },
      {
        key: "surgical_candidate",
        label: "Being considered for surgery?",
        type: "select",
        required: true,
        options: ["Yes", "No"],
      },
    ],
    redFlags: [
      "Suspected acute, full-thickness rotator cuff tear in an active/working-age patient",
      "Suspected fracture or dislocation",
      "Signs of infection",
      "Significant acute instability after trauma",
    ],
    aetna:
      "Same CPB (#0171) framework as knee: necessary for tumor evaluation, or for persistent pain/instability not responding to conservative therapy, with X-ray having ruled out fracture/bony pathology first when trauma is involved. Rotator cuff pathology is evaluated against documented conservative care (rest, NSAIDs, PT, injections) before advanced imaging for non-urgent cases.",
    evicore:
      "Similar logic to knee — acute trauma with suspected fracture/dislocation moves faster; chronic pain workups need conservative-care documentation first.",
    sources: "Aetna CPB #0171. eviCore Musculoskeletal Imaging Guidelines.",
    promptNotes:
      "Flag whether the patient is being considered for surgery — both payers move faster on imaging when a surgical decision is time-sensitive (e.g. young patient, acute full-thickness tear) versus a routine chronic-pain workup.",
  },
  {
    key: "brain_mri",
    label: "Brain MRI",
    requiredFields: [
      {
        key: "symptom_history",
        label: "Headache/symptom history",
        type: "textarea",
        required: true,
        helpText: "Onset, duration, change in pattern/frequency/intensity",
      },
      { key: "patient_age", label: "Patient age", type: "number", required: true, helpText: "New-onset headache after 50 is an independent red flag" },
      {
        key: "associated_symptoms",
        label: "Associated symptoms",
        type: "textarea",
        required: false,
        helpText: "Fever, neck stiffness, focal neuro deficits, vision changes, seizures",
      },
      { key: "posture_symptoms", label: "Posture-related symptom changes", type: "text", required: false, helpText: "Worse lying down vs. standing" },
      { key: "triggers", label: "Triggers", type: "text", required: false, helpText: "Cough, exertion, sexual activity" },
      {
        key: "clinical_question",
        label: "Clinical question being answered",
        type: "select",
        required: true,
        options: ["Tumor surveillance/follow-up", "New symptom workup", "Seizure workup", "Other"],
      },
    ],
    redFlags: [
      "New-onset headache in a patient over 50",
      "Progressive change in headache pattern/frequency/intensity not responding to previously effective treatment",
      "Transformation from episodic to chronic headache (>15 days/month for over 3 months)",
      "Fever + neck stiffness + headache (possible meningitis/subarachnoid hemorrhage — urgent, not routine PA)",
      "Posture-dependent headache",
      "Headache triggered by cough, exertion, or sexual activity",
      "Focal neurological deficit, seizure, or altered consciousness",
    ],
    aetna:
      "No single consolidated 'brain MRI' bulletin — necessity is evaluated per clinical indication (fMRI pre-surgical planning under CPB #0739; MRA/MRV vascular indications under CPB #0094; PET-related brain indications under CPB #0071). For headache specifically, Aetna does not consider MRA necessary for routine workup of non-specific, non-focal symptoms absent red flags or focal findings.",
    evicore:
      "No dedicated section captured yet for brain MRI beyond general red-flag-based neuroimaging standards.",
    sources:
      "Aetna CPB #0739 (fMRI), CPB #0094 (MRA/MRV), CPB #0071 (PET); general red-flag criteria from headache-specialty literature, not one dedicated CPB.",
    promptNotes:
      "There is no single clean bulletin for brain MRI necessity — route by the specific clinical question (tumor surveillance? new headache workup? seizure workup?) rather than treating it as one generic procedure. State this limitation plainly if the case doesn't clearly match a red flag or a specific CPB indication.",
  },
  {
    key: "ct_abdomen_pelvis",
    label: "CT Abdomen/Pelvis (with contrast)",
    requiredFields: [
      {
        key: "clinical_indication",
        label: "Clinical indication",
        type: "select",
        required: true,
        options: ["Acute abdominal pain workup", "Oncology staging/surveillance", "Other"],
      },
      { key: "symptom_character", label: "Symptom duration and character (if acute pain workup)", type: "textarea", required: false },
      { key: "renal_function", label: "Relevant lab results (e.g. renal function)", type: "text", required: true, helpText: "Affects contrast eligibility" },
      { key: "malignancy_details", label: "Known/suspected malignancy details (if oncology-related)", type: "textarea", required: false },
      { key: "prior_imaging", label: "Prior imaging already performed", type: "text", required: false },
    ],
    redFlags: [
      "Acute severe abdominal pain with signs of obstruction, perforation, or vascular emergency (typically ER/inpatient — not a PA scenario)",
      "Known malignancy requiring staging or surveillance per treatment protocol",
      "Severe renal insufficiency (eGFR <30) — contrast contraindication in some cases",
    ],
    aetna:
      "No general 'CT abdomen/pelvis' bulletin — necessity is diagnosis-driven, most often oncology staging/surveillance (see PET section) or acute abdominal symptom workup, which follows standard CPT-code-specific precertification lookup rather than a single named bulletin.",
    evicore: "No single dedicated bulletin found for this procedure broadly; necessity is diagnosis-driven.",
    sources: "No dedicated Aetna/eviCore bulletin. Contrast safety thresholds from ACR Manual on Contrast Media.",
    promptNotes:
      "This category is less standardized than joint or spine imaging. Ask for the underlying diagnosis/reason for the scan first, then justify against that diagnosis's standard workup rather than a universal criterion.",
  },
  {
    key: "ct_chest",
    label: "CT Chest (with contrast)",
    requiredFields: [
      {
        key: "clinical_indication",
        label: "Clinical indication",
        type: "select",
        required: true,
        options: ["Pulmonary nodule follow-up", "Oncology staging", "Suspected PE", "Other"],
      },
      { key: "symptom_history", label: "Symptom history (if acute)", type: "textarea", required: false, helpText: "Chest pain, shortness of breath, hemoptysis" },
      { key: "prior_imaging", label: "Prior chest imaging (X-ray) findings", type: "text", required: false },
      { key: "malignancy_details", label: "Known/suspected malignancy details (if oncology-related)", type: "textarea", required: false },
      { key: "renal_function", label: "Renal function (contrast eligibility)", type: "text", required: true },
      {
        key: "nodule_details",
        label: "Nodule size and growth interval (if nodule follow-up)",
        type: "text",
        required: false,
        helpText: "Reference Fleischner Society criteria",
      },
    ],
    redFlags: [
      "Suspected pulmonary embolism with acute symptoms (often urgent/ER pathway)",
      "Known malignancy requiring staging per treatment protocol",
      "Indeterminate pulmonary nodule meeting size/growth criteria for further workup",
    ],
    aetna:
      "No stand-alone 'CT chest' bulletin — evaluated against the underlying indication: oncology staging follows cancer-specific protocols; pulmonary nodule follow-up follows radiology society guidelines (Fleischner Society criteria); acute symptom workups go through standard precertification.",
    evicore: "No single dedicated bulletin found broadly; necessity is diagnosis-driven.",
    sources: "No dedicated Aetna/eviCore bulletin. Fleischner Society criteria are the de facto standard for nodule follow-up.",
    promptNotes:
      "Same approach as CT abdomen/pelvis: ask for the underlying diagnosis/reason first. For nodule follow-up specifically, reference nodule size and growth interval explicitly — insurers expect Fleischner Society criteria even though Aetna doesn't publish its own restated bulletin.",
  },
  {
    key: "pet_scan",
    label: "PET Scan (PET/CT)",
    requiredFields: [
      { key: "cancer_type_stage", label: "Cancer type and stage (if oncology-related)", type: "text", required: true },
      {
        key: "purpose",
        label: "Purpose",
        type: "select",
        required: true,
        options: ["Initial staging", "Treatment response assessment", "Surveillance", "Recurrence workup"],
      },
      { key: "prior_imaging", label: "Prior imaging already performed (CT, MRI) and findings", type: "textarea", required: true },
      { key: "non_oncology_indication", label: "Non-oncology indication, if applicable", type: "text", required: false, helpText: "e.g. cardiac viability, certain neurological conditions" },
    ],
    redFlags: [
      "None generally applicable — PET necessity is driven entirely by matching the specific diagnosis to Aetna's per-condition list in CPB #0071, not by red-flag override logic.",
    ],
    aetna:
      "The most condition-specific bulletin of all procedures here (CPB #0071) — necessity is established per specific diagnosis (numerous cancer types, each with its own listed indication), not a general 'PET scan' criterion. Aetna explicitly does NOT consider PET necessary for several specific conditions where evidence is lacking.",
    evicore: "Not separately captured; defer to Aetna CPB #0071 diagnosis list as the working reference.",
    sources: "Aetna CPB #0071 (Positron Emission Tomography).",
    promptNotes:
      "This procedure needs the most diagnosis-specific lookup — a generic justification template will not work well. Confirm the cancer type/diagnosis is explicitly listed in Aetna's CPB #0071 indications before drafting; flag to staff if it's not listed (likely denial risk).",
  },
];

export function getProcedure(key: string): ProcedureCriteria | undefined {
  return PROCEDURES.find((p) => p.key === key);
}

export function getMissingRequiredFields(
  procedure: Pick<ProcedureCriteria, "requiredFields">,
  caseFields: Record<string, string>
): FieldDef[] {
  return procedure.requiredFields.filter((f) => f.required && !caseFields[f.key]?.trim());
}

export const LETTER_COMPONENTS = [
  "Patient demographics with member ID",
  "Specific diagnosis with ICD-10 code(s)",
  "Detailed treatment/procedure description with CPT/HCPCS code(s)",
  "Citation of the specific payer policy/CPB/guideline demonstrating coverage criteria compliance",
  "Clinical rationale explaining why the treatment/imaging is necessary now",
  "Previous treatments attempted, with outcomes and duration",
  "Total treatment/symptom duration",
  "Physician signature with credentials",
];

// Fallback used only if the DB has no active prompt_templates row yet
// (e.g. migrations 0001-0003 ran but 0004's seed didn't). Keep this in sync
// with the seed row in supabase/migrations/0004_seed_defaults.sql.
export const DEFAULT_PROMPT_TEMPLATE = `You are asaanbil.com's prior-authorization letter drafting assistant for US medical practices.

You draft prior-authorization justification letters for imaging orders so clinic staff can review, edit, and submit them to the payer. You never see or store real patient names — every case is de-identified by the intake form before it reaches you.

PROCEDURE: {{procedure_label}}

Payer medical-necessity criteria (paraphrased reference — cite the substance, never claim these are direct quotes from the payer):
— Aetna: {{aetna}}
— Cigna / eviCore: {{evicore}}
— Sources: {{sources}}

Red flags that bypass the standard conservative-care requirement for this procedure:
{{red_flags_list}}

Drafting guidance specific to this procedure: {{prompt_notes}}

{{excluded_payers_note}}

LETTER STRUCTURE — every letter must contain exactly these 8 components, in this order, clearly delineated:
{{letter_components_list}}

RULES:
- If any red flag from the list above is present in the case, lead the clinical rationale with it — it overrides the standard conservative-care narrative.
- If no red flag is present, the letter must explicitly state the conservative treatment type, duration, and outcome. This is the single most common reason these letters get denied.
- Explicitly map each documented finding to the specific criterion it satisfies, in your own words — never copy the payer's bulletin language verbatim.
- If a required input looks missing or vague, note it plainly in a "Documentation Gaps" line at the end of the letter rather than inventing details.
- Write in a professional, clinical tone suitable for a physician's signature. Do not use placeholder brackets like [PATIENT NAME] — use the de-identified reference exactly as given.
- Output only the letter text (component 1 through component 8). No preamble, no meta-commentary about the task.`;

export const EXCLUDED_PAYERS_NOTE =
  "UnitedHealthcare, Humana, and BCBS/Anthem are not covered by published, citable criteria in this system yet " +
  "(their necessity criteria are proprietary — InterQual, MCG, or state-specific BCBS policy libraries). " +
  "If the payer is one of these, say so plainly in the letter's rationale rather than inventing a citation, " +
  "and draft against general clinical necessity and the closest applicable red-flag/conservative-care logic instead.";
