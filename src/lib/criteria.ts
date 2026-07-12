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

export type PayerKey =
  | "aetna"
  | "cigna_evicore"
  | "uhc"
  | "humana"
  | "anthem"
  | "molina"
  | "medicare_ffs"
  | "other";

// hasCriteria distinguishes "this payer has a specific procedure-level
// narrative in ProcedureCriteria.aetna/.evicore" (only Aetna and Cigna/
// eviCore do) from "this payer still has a real, citable necessity
// standard, just not one written per-procedure in this file" (the other
// five below all have one — see getOtherPayerGuidance). Only the literal
// "other" bucket (an unnamed/unlisted plan) has no citation strategy at
// all, which is what the form's warning banner is actually about.
export const PAYERS: { key: PayerKey; label: string; hasCriteria: boolean }[] = [
  { key: "aetna", label: "Aetna", hasCriteria: true },
  { key: "cigna_evicore", label: "Cigna / eviCore", hasCriteria: true },
  { key: "uhc", label: "UnitedHealthcare", hasCriteria: true },
  { key: "humana", label: "Humana", hasCriteria: true },
  { key: "anthem", label: "Anthem / Elevance (BCBS)", hasCriteria: true },
  { key: "molina", label: "Molina Healthcare", hasCriteria: true },
  { key: "medicare_ffs", label: "Medicare (Traditional / FFS)", hasCriteria: true },
  { key: "other", label: "Other / unlisted plan", hasCriteria: false },
];

// Payer-level (not procedure-level) citation guidance for the five payers
// that don't get their own narrative field on ProcedureCriteria. Each of
// these payers' own internal review criteria (InterQual, MCG) is
// proprietary and not publicly citable — naming a specific InterQual/MCG
// criterion number in a letter is worse than citing nothing, since it's
// unverifiable and reads as guessing. The correct move for all five is to
// cite the real, public standard each one actually accepts instead.
export function getOtherPayerGuidance(payer: PayerKey): string {
  switch (payer) {
    case "uhc":
      return (
        "This case is for UnitedHealthcare. UHC's internal InterQual criteria are proprietary and not publicly " +
        "accessible — never cite InterQual or invent a Coverage Determination Guideline number. Instead cite ACR " +
        "Appropriateness Criteria by name and score (e.g. \"Usually Appropriate,\" score 8-9) for imaging, or the " +
        "applicable CMS NCD/LCD for Medicare Advantage plans. Note for staff: UHC's appeal deadline is 65 days from " +
        "denial for every plan type (commercial and Medicare Advantage alike) — shorter than most other payers and " +
        "the single most commonly missed deadline."
      );
    case "humana":
      return (
        "This case is for Humana. Humana's MCG (Milliman Care Guidelines) and InterQual criteria are proprietary — " +
        "never cite them by name or number. For Medicare Advantage plans (Humana's dominant book of business), cite " +
        "the applicable CMS NCD/LCD as the coverage floor; for commercial plans, cite ACR Appropriateness Criteria. " +
        "Humana specifically expects documented functional limitations stated in concrete terms — \"pain 8/10, " +
        "limiting ambulation to 5 minutes, unable to perform job duties as a delivery driver\" — not a generic " +
        "statement like \"severe pain.\""
      );
    case "anthem":
      return (
        "This case is for Anthem/Elevance Health (or another regional BCBS licensee). Imaging, MSK, and cardiology " +
        "requests are reviewed against Carelon Clinical Appropriateness Guidelines — cite Carelon by guideline " +
        "section name. Specialty drug, oncology, GI, and genetic-testing requests instead route through eviCore " +
        "Specialty Guidelines on some Anthem plans. Confirm which entity actually reviews this case type (check the " +
        "denial letterhead if this is an appeal) before citing — the wrong citation reads as unfamiliarity with the " +
        "payer's own process. Also distinguish the two separate appeal tracks: billing disputes (wrong code, missing " +
        "info, timely filing) go through the PDR process; medical-necessity denials go through Clinical UM — using " +
        "the wrong track forfeits the deadline."
      );
    case "molina":
      return (
        "This case is for Molina Healthcare. Molina applies its own internal utilization management using " +
        "state-specific Medicaid coverage policy, layered with InterQual in some categories — never cite InterQual " +
        "by name. Cite the relevant state Medicaid coverage policy alongside ACR/AHA/ACOG society guidelines. For " +
        "Medicare Advantage plans, cite the applicable CMS NCD/LCD as the floor. Molina has the highest denial rate " +
        "of the major payers, and its timely-filing limits are genuinely state-specific (from 95 days in Texas to " +
        "365 in Ohio) — never assume a single Molina deadline without confirming the plan's state."
      );
    case "medicare_ffs":
      return (
        "This case is for traditional/fee-for-service Medicare. Cite the specific CMS National Coverage " +
        "Determination (NCD) or Local Coverage Determination (LCD) that governs this procedure — this is the " +
        "correct and expected citation format for Medicare, not a specialty-society guideline. Which Medicare " +
        "Administrative Contractor (MAC) applies depends on the practice's state; note that traditional Medicare " +
        "requires PA for a much narrower set of services than Medicare Advantage (mostly DME, home health, and " +
        "select outpatient hospital procedures), so confirm PA is actually required here at all before drafting."
      );
    default:
      return (
        "No specific payer beyond \"Other\" was identified for this case. Cite the relevant specialty-society " +
        "guideline (ACR, AHA/ACC, ACOG, or NCCN — whichever body governs this clinical area) and state plainly that " +
        "no payer-specific bulletin was referenced, rather than inventing one."
      );
  }
}

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
  {
    key: "hip_pelvis_mri",
    label: "Hip / Pelvis MRI",
    requiredFields: [
      { key: "symptom_mechanism", label: "Symptom duration and mechanism", type: "text", required: true, helpText: "Acute injury vs. chronic/degenerative" },
      { key: "exam_findings", label: "Objective exam", type: "textarea", required: true, helpText: "FABER/FADIR test results, ROM, gait" },
      { key: "conservative_treatment", label: "Conservative treatment tried (type, duration, outcome)", type: "textarea", required: true },
      { key: "prior_imaging", label: "Prior imaging (X-ray) results", type: "text", required: true },
      { key: "suspected_pathology", label: "Suspected pathology", type: "select", required: true, options: ["Osteoarthritis / labral tear", "Avascular necrosis (AVN)", "Occult fracture", "FAI / labral tear"] },
    ],
    redFlags: [
      "Suspected avascular necrosis (steroid use, alcohol use, sickle cell disease, or post-trauma)",
      "Suspected occult fracture in an elderly patient with a negative X-ray",
    ],
    aetna:
      "Same extremity-MRI framework as knee/shoulder (CPB #0171): X-ray first, then 4 weeks of conservative care unless an exception applies. Suspected AVN (steroid use, alcohol, sickle cell, post-traumatic) bypasses conservative care entirely as a surgical-urgency indication. An elderly patient with hip pain and a negative X-ray is evaluated for occult fracture the same way — imaging is not delayed for conservative care in that scenario either.",
    evicore:
      "Mirrors knee/shoulder logic: acute trauma and suspected AVN/occult fracture move faster than a routine chronic-pain workup, which still needs conservative-care documentation first. FAI/labral tear suspicion routes to the arthrogram protocol (CPT 73723), not a standard MRI — using the wrong code is a common avoidable denial here.",
    sources: "Aetna CPB #0171 (MRI of the Extremities). eviCore Musculoskeletal Imaging Guidelines.",
    promptNotes:
      "Confirm which suspected pathology applies before drafting — AVN and occult fracture both bypass conservative care, but a routine OA/labral workup does not. If a labral tear or FAI is suspected, flag that the correct CPT is the arthrogram code (73723), not standard hip MRI (73721).",
  },
  {
    key: "ct_spine",
    label: "CT Spine",
    requiredFields: [
      { key: "clinical_indication", label: "Clinical indication", type: "select", required: true, options: ["MRI contraindicated", "Post-surgical hardware assessment", "Trauma / fracture characterization", "Bone lesion, MRI non-diagnostic"] },
      { key: "mri_contraindication", label: "MRI contraindication (if applicable)", type: "text", required: false, helpText: "Pacemaker, cochlear implant, severe claustrophobia" },
      { key: "symptom_history", label: "Symptom history", type: "textarea", required: true },
      { key: "prior_imaging", label: "Prior imaging already performed", type: "text", required: false },
    ],
    redFlags: [],
    aetna:
      "CT spine is treated as second-line to MRI, not a substitute for it — necessity is established by documenting why MRI either can't be done (contraindication) or wasn't diagnostic, rather than by the same conservative-care/red-flag logic used for MRI itself.",
    evicore:
      "Same second-line framing: approved for MRI contraindication, post-surgical hardware assessment (MRI is degraded by metal artifact), acute trauma fracture characterization, or a bone lesion where MRI wasn't diagnostic.",
    sources: "No dedicated Aetna/eviCore bulletin found broadly; necessity is framed relative to MRI eligibility.",
    promptNotes:
      "The single most important thing to document is why MRI isn't the right test here — an MRI contraindication checkbox or an explicit statement that MRI was non-diagnostic. Without that, this reads as a routine spine workup that should have gone to MRI first.",
  },
  {
    key: "nuclear_cardiology",
    label: "Nuclear Cardiology / Stress Imaging",
    requiredFields: [
      { key: "clinical_indication", label: "Clinical indication", type: "select", required: true, options: ["Intermediate-risk chest pain", "Known CAD, worsening symptoms", "Pre-op cardiac risk assessment"] },
      { key: "ecg_status", label: "Standard exercise ECG stress test status", type: "select", required: true, options: ["Not tried", "Insufficient / uninterpretable result", "Contraindicated"] },
      { key: "ecg_contraindication_detail", label: "Contraindication detail, if applicable", type: "text", required: false, helpText: "LBBB, paced rhythm, WPW, poor exercise tolerance" },
      { key: "symptom_history", label: "Symptom history", type: "textarea", required: true },
    ],
    redFlags: [],
    aetna:
      "Requires documentation that a standard exercise ECG stress test is either insufficient, uninterpretable, or contraindicated before nuclear/stress imaging is approved — this isn't a first-line test. Indications otherwise: intermediate-risk chest pain, known CAD with worsening symptoms, or pre-op cardiac risk assessment for a high-risk surgery.",
    evicore:
      "Same threshold — document why plain exercise ECG doesn't answer the clinical question (LBBB, paced rhythm, WPW, or poor exercise tolerance making the test uninterpretable) before nuclear imaging is considered appropriate.",
    sources: "No dedicated Aetna/eviCore bulletin found broadly. Note: UHC expanded PA requirements for cardiology codes effective April 2026.",
    promptNotes:
      "The #1 denial reason is skipping straight to nuclear imaging without documenting why plain exercise ECG wasn't sufficient — always state the specific reason (LBBB, paced rhythm, WPW, or physical inability to exercise) explicitly.",
  },
  {
    key: "lumbar_spinal_fusion",
    label: "Lumbar Spinal Fusion",
    requiredFields: [
      { key: "conservative_treatment", label: "Conservative treatment history (3-6 months)", type: "textarea", required: true, helpText: "PT, NSAIDs, at least one epidural steroid injection for some payers" },
      { key: "odi_score", label: "Oswestry Disability Index (ODI) score", type: "number", required: true, helpText: "40%+ generally supports surgical necessity" },
      { key: "mri_correlation", label: "MRI findings and correlation with symptoms", type: "textarea", required: true },
      { key: "exam_findings", label: "Objective exam findings", type: "textarea", required: true },
    ],
    redFlags: [
      "Cauda equina syndrome",
      "Progressive neurological deficit",
      "Tumor or infection causing spinal instability",
      "Traumatic instability",
    ],
    aetna:
      "Requires 3-6 months of documented conservative care (PT, NSAIDs, and at least one epidural steroid injection for some plan variants), an ODI score in the severe-disability range (40%+), and MRI findings that correlate with the clinical symptoms and level. Cauda equina, progressive neurological deficit, tumor/infection causing instability, or traumatic instability all bypass the conservative-care requirement as surgical emergencies.",
    evicore:
      "Same conservative-care and ODI-threshold framework, with the same red-flag exceptions bypassing it entirely.",
    sources: "eviCore Spine Surgery Guidelines. ODI is the standard functional-outcome measure most payers require.",
    promptNotes:
      "The #1 denial reason is a missing or uncalculated ODI score — state the number explicitly (e.g. \"ODI score 47/100 (47%), indicating severe disability\"), not just \"significant disability.\"",
  },
  {
    key: "total_knee_arthroplasty",
    label: "Total Knee Arthroplasty (TKA)",
    requiredFields: [
      { key: "conservative_treatment", label: "Conservative treatment history (3-6 months)", type: "textarea", required: true, helpText: "NSAIDs, PT, corticosteroid injection, ambulatory aids" },
      { key: "xray_findings", label: "Weight-bearing X-ray findings", type: "text", required: true, helpText: "Must specify weight-bearing and the Kellgren-Lawrence grade" },
      { key: "functional_score", label: "Oxford Knee Score (OKS) or KOOS", type: "number", required: true, helpText: "Below 27 (OKS) indicates severe functional impairment" },
    ],
    redFlags: [],
    aetna:
      "Requires 3-6 months of NSAIDs, PT, corticosteroid injection, and ambulatory aid use, plus a weight-bearing X-ray (non-weight-bearing films are insufficient) showing Kellgren-Lawrence Grade 3-4 changes. Humana and UHC specifically also require a documented Oxford Knee Score or KOOS.",
    evicore:
      "Same conservative-care and imaging threshold; the functional-score requirement (OKS/KOOS) is increasingly enforced across payers, not just Humana/UHC.",
    sources: "Kellgren-Lawrence radiographic grading is the accepted standard; OKS/KOOS are the standard functional-outcome measures.",
    promptNotes:
      "Two specific, easy-to-miss details drive denials here: the X-ray must be explicitly described as weight-bearing (not just \"X-ray showed OA\"), and the K-L grade and OKS/KOOS score should both be stated as numbers.",
  },
  {
    key: "total_hip_arthroplasty",
    label: "Total Hip Arthroplasty (THA)",
    requiredFields: [
      { key: "conservative_treatment", label: "Conservative treatment history (3-6 months)", type: "textarea", required: true },
      { key: "xray_findings", label: "Weight-bearing X-ray findings", type: "text", required: true, helpText: "Kellgren-Lawrence grade" },
      { key: "hhs_score", label: "Harris Hip Score (HHS)", type: "number", required: true, helpText: "Below 60 indicates poor functional status supporting surgery" },
      { key: "avn_stage", label: "AVN Ficat stage, if applicable", type: "text", required: false },
    ],
    redFlags: ["Avascular necrosis (AVN), Ficat Stage 3-4"],
    aetna:
      "Same framework as TKA (weight-bearing X-ray, Kellgren-Lawrence Grade 3-4, 3-6 months conservative care), scored with the Harris Hip Score instead of OKS — a score below 60 supports surgical necessity. AVN at Ficat Stage 3-4 is an immediate surgical candidate and bypasses the conservative-care requirement entirely.",
    evicore: "Same conservative-care and imaging threshold, same AVN Ficat-stage exception.",
    sources: "Kellgren-Lawrence grading; Harris Hip Score (HHS); Ficat staging for AVN.",
    promptNotes:
      "State the HHS number explicitly, and if AVN is suspected, name the Ficat stage — Stage 3-4 is what actually bypasses the conservative-care documentation requirement, not a general AVN diagnosis alone.",
  },
  {
    key: "knee_arthroscopy",
    label: "Knee Arthroscopy (Meniscal / ACL)",
    requiredFields: [
      { key: "tear_type", label: "Tear type", type: "select", required: true, options: ["Meniscal tear", "ACL tear", "Loose body"] },
      { key: "mri_findings", label: "MRI findings", type: "text", required: true, helpText: "Tear grade and location" },
      { key: "mechanical_symptoms", label: "Mechanical symptoms present?", type: "select", required: true, options: ["Yes — locking, giving way, or clicking", "No"] },
      { key: "conservative_treatment", label: "Conservative treatment tried (6 weeks) and outcome", type: "textarea", required: false },
    ],
    redFlags: ["Locked knee joint (mechanical block)"],
    aetna:
      "Meniscal repair requires an MRI-confirmed grade 3 tear plus documented mechanical symptoms (locking, giving way, clicking) and 6 weeks of conservative care — a locked joint bypasses the conservative-care requirement. ACL requires an MRI-confirmed tear plus functional instability and an activity level requiring joint stability. Degenerative meniscal tears without mechanical symptoms are increasingly denied outright, since clinical evidence shows PT produces outcomes comparable to arthroscopy in that specific scenario.",
    evicore: "Same mechanical-symptoms threshold for meniscal repair; same MRI-confirmation standard for ACL.",
    sources: "Clinical evidence on degenerative meniscal tears (PT vs. arthroscopy outcomes) is the basis for the mechanical-symptoms requirement.",
    promptNotes:
      "If no mechanical symptoms are present and the tear is degenerative rather than traumatic, say so plainly — a letter built entirely on MRI findings without mechanical symptoms is very likely to be denied regardless of tear severity; flag this to staff rather than drafting an over-confident letter.",
  },
  {
    key: "rotator_cuff_repair",
    label: "Rotator Cuff Repair",
    requiredFields: [
      { key: "tear_type", label: "Tear type", type: "select", required: true, options: ["Full-thickness", "Partial-thickness"] },
      { key: "mri_findings", label: "MRI findings", type: "textarea", required: true, helpText: "Tear size (mm), Goutallier grade, muscle atrophy" },
      { key: "mechanism", label: "Mechanism", type: "select", required: true, options: ["Acute traumatic tear", "Chronic / overuse"] },
      { key: "conservative_treatment", label: "Conservative treatment tried and outcome", type: "textarea", required: false },
    ],
    redFlags: ["Acute traumatic full-thickness tear", "Goutallier Grade 2+ fatty infiltration (repair urgency)"],
    aetna:
      "Full-thickness tears require MRI confirmation, documented functional limitation, and 4-6 weeks of conservative care — unless the tear is an acute traumatic complete tear or shows Goutallier Grade 2+ fatty infiltration, either of which creates surgical urgency and bypasses that requirement. Partial-thickness tears need 3 months of PT, NSAIDs, and an injection trial first.",
    evicore: "Same full-thickness vs. partial-thickness distinction and urgency exceptions.",
    sources: "Goutallier grading for rotator cuff fatty infiltration is the accepted standard for urgency assessment.",
    promptNotes:
      "State whether the tear is full- or partial-thickness explicitly, and if full-thickness, state the Goutallier grade — a Grade 2+ finding is what actually justifies skipping the standard conservative-care window, not just \"full-thickness tear\" alone.",
  },
  {
    key: "acdf_cervical_fusion",
    label: "ACDF — Cervical Fusion",
    requiredFields: [
      { key: "presentation", label: "Presentation", type: "select", required: true, options: ["Myelopathy signs", "Radiculopathy"] },
      { key: "exam_findings", label: "Objective exam findings", type: "textarea", required: true, helpText: "Gait disturbance, hand clumsiness, Lhermitte's/Hoffman's signs for myelopathy; dermatomal weakness for radiculopathy" },
      { key: "mri_correlation", label: "MRI findings and correlation with symptoms", type: "textarea", required: true },
      { key: "ndi_score", label: "Neck Disability Index (NDI) score", type: "number", required: false, helpText: "Above 28% supports surgical necessity" },
      { key: "conservative_treatment", label: "Conservative treatment tried (6-12 weeks), if not myelopathy", type: "textarea", required: false },
    ],
    redFlags: ["Myelopathy signs (gait disturbance, hand clumsiness, Lhermitte's sign, Hoffman's sign, hyperreflexia)"],
    aetna:
      "Myelopathy signs (gait disturbance, hand clumsiness, Lhermitte's or Hoffman's sign, hyperreflexia) are treated as a surgical emergency that bypasses conservative care entirely — this should be flagged for expedited handling. Radiculopathy without myelopathy instead requires 6-12 weeks of conservative care plus MRI correlation and documented upper-extremity weakness in a dermatomal distribution; an NDI score above 28% supports the surgical case.",
    evicore: "Same myelopathy-vs-radiculopathy distinction and urgency handling.",
    sources: "Neck Disability Index (NDI) is the standard functional-outcome measure for cervical spine surgery.",
    promptNotes:
      "The single most consequential mistake here is documenting myelopathy signs but still routing the letter through the standard, non-urgent path — myelopathy should always trigger expedited handling and a surgical-emergency framing, never a conservative-care discussion.",
  },
  {
    key: "tavr",
    label: "TAVR — Transcatheter Aortic Valve Replacement",
    requiredFields: [
      { key: "echo_findings", label: "Echocardiogram findings", type: "text", required: true, helpText: "Valve area <1.0 cm², mean gradient >40mmHg for severe stenosis" },
      { key: "heart_team_cardiology", label: "Interventional cardiology evaluation on file?", type: "select", required: true, options: ["Yes", "No"] },
      { key: "heart_team_surgery", label: "Cardiac surgery evaluation on file?", type: "select", required: true, options: ["Yes", "No"] },
      { key: "sts_score", label: "STS PROM score", type: "text", required: true, helpText: "Score above 8% indicates high/prohibitive surgical risk" },
      { key: "ct_angiography", label: "CT angiography for access planning completed?", type: "select", required: false, options: ["Yes", "No"] },
    ],
    redFlags: [],
    aetna:
      "A CMS Outpatient Department PA-list procedure. Requires echocardiogram-confirmed severe aortic stenosis (valve area under 1.0 cm², mean gradient over 40mmHg), a documented Heart Team evaluation signed by BOTH an interventional cardiologist and a cardiac surgeon, an STS PROM score establishing high or prohibitive surgical risk (typically above 8%), and CT angiography for access planning.",
    evicore: "Same Heart Team, echo, and STS-score requirements — this is a CMS-list procedure reviewed consistently across payers.",
    sources: "CMS Outpatient Department (OPD) prior authorization list. STS PROM is the standard surgical-risk score.",
    promptNotes:
      "The Heart Team sign-off is a hard block, not a soft preference — a letter missing either the cardiology or the surgery evaluation (only one specialty documented) will be denied regardless of how strong the clinical picture otherwise is. Confirm both are on file before drafting.",
  },
  {
    key: "bariatric_surgery",
    label: "Bariatric Surgery",
    requiredFields: [
      { key: "bmi", label: "BMI", type: "number", required: true, helpText: "≥40, or ≥35 with a qualifying comorbidity" },
      { key: "comorbidities", label: "Qualifying comorbidities, if BMI 35-39.9", type: "text", required: false, helpText: "Type 2 diabetes, hypertension, sleep apnea" },
      { key: "diet_program", label: "6-month medically supervised diet program — monthly visit dates", type: "textarea", required: true },
      { key: "multidisciplinary_eval", label: "Multidisciplinary evaluation completed", type: "textarea", required: true, helpText: "Surgeon, psychologist, dietitian, and cardiology if indicated" },
      { key: "psych_clearance", label: "Psychological clearance obtained?", type: "select", required: true, options: ["Yes", "No"] },
    ],
    redFlags: [],
    aetna:
      "Requires BMI 40+ (or 35+ with a qualifying comorbidity such as type 2 diabetes, hypertension, or sleep apnea), a 6-month medically supervised diet program with monthly provider visits documented by date, a multidisciplinary evaluation (surgeon, psychologist, dietitian, plus cardiology if indicated), and separate psychological clearance.",
    evicore: "Same 6-month supervised diet program and multidisciplinary evaluation requirements.",
    sources: "Standard bariatric surgery criteria used across major payers.",
    promptNotes:
      "The 6-month supervised diet program is a hard block — the letter needs all 6 monthly visit dates listed explicitly, not just \"completed a supervised diet program.\" Missing or incomplete visit dates is the #1 denial reason for this procedure.",
  },
  {
    key: "epidural_steroid_injection",
    label: "Epidural Steroid Injection",
    requiredFields: [
      { key: "pain_type", label: "Pain type", type: "select", required: true, options: ["Radicular (dermatomal distribution)", "Axial only"] },
      { key: "symptomatic_level", label: "Symptomatic spinal level", type: "text", required: true, helpText: "Must correlate with imaging findings" },
      { key: "conservative_treatment", label: "Conservative treatment tried (2-4 weeks)", type: "textarea", required: true },
      { key: "imaging_correlation", label: "Imaging findings at the symptomatic level", type: "text", required: true },
      { key: "image_guidance", label: "Image guidance planned", type: "select", required: true, options: ["Fluoroscopy or CT guidance", "None planned"] },
    ],
    redFlags: [],
    aetna:
      "Requires radicular pain (not purely axial) in a dermatomal distribution, 2-4 weeks of failed conservative care, and imaging showing structural pathology that correlates with the specific symptomatic level and dermatome. Image guidance (fluoroscopy or CT) is required or strongly preferred. Most payers cap this at 3 injections per spine region per year.",
    evicore: "Same radicular-pain and level-correlation requirements.",
    sources: "eviCore Interventional Pain Management Guidelines.",
    promptNotes:
      "The #1 denial reason is imaging described generically (\"lumbar pathology\") without naming the specific level — always state the symptomatic level and confirm it matches the imaging finding exactly.",
  },
  {
    key: "facet_joint_injection",
    label: "Facet Joint Injection / Medial Branch Block",
    requiredFields: [
      { key: "pain_type", label: "Pain type", type: "select", required: true, options: ["Axial (facet-pattern)", "Radicular"] },
      { key: "exam_findings", label: "Exam findings", type: "textarea", required: true, helpText: "Facet joint tenderness, pain with facet loading maneuvers" },
      { key: "imaging_findings", label: "Imaging findings (facet arthropathy)", type: "text", required: true },
      { key: "conservative_treatment", label: "Conservative treatment tried (4-6 weeks)", type: "textarea", required: true },
      { key: "block_relief_percent", label: "Percent pain relief from diagnostic medial branch block, if this is a follow-up RFA candidacy check", type: "number", required: false },
    ],
    redFlags: [],
    aetna:
      "Requires axial (not primarily radicular) spinal pain with facet joint tenderness and pain reproduced by facet-loading maneuvers, imaging showing facet arthropathy, and 4-6 weeks of NSAIDs plus PT. A diagnostic medial branch block is the required first step before radiofrequency ablation — at least 50% pain relief from the block must be documented to proceed.",
    evicore: "Same axial-pain and facet-arthropathy imaging requirement.",
    sources: "eviCore Interventional Pain Management Guidelines.",
    promptNotes:
      "Radicular pain should never be routed through a facet injection request — it belongs with epidural steroid injection instead. Confirm axial vs. radicular explicitly before drafting; this is the single most common misrouting denial in pain management.",
  },
  {
    key: "radiofrequency_ablation",
    label: "Radiofrequency Ablation (RFA)",
    requiredFields: [
      { key: "block_relief_percent", label: "Percent pain relief from diagnostic medial branch block", type: "number", required: true, helpText: "At least 50% required to proceed; Aetna/UHC often require two diagnostic blocks" },
      { key: "block_dates", label: "Diagnostic block date(s) and pain scale before/after", type: "textarea", required: true },
      { key: "spinal_level", label: "Spinal level(s)", type: "text", required: true },
      { key: "prior_rfa_history", label: "Prior RFA at this level, and date", type: "text", required: false, helpText: "6 months minimum required between RFA procedures at the same level" },
    ],
    redFlags: [],
    aetna:
      "Requires a documented diagnostic medial branch block with at least 50% pain relief, stated as a specific percentage with a numeric pain scale before and after — not just \"good relief.\" Aetna and UHC often require two diagnostic blocks before approving RFA. A minimum of 6 months is required between RFA procedures at the same spinal level, and each level is billed and justified separately.",
    evicore: "Same 50%-relief diagnostic-block prerequisite.",
    sources: "eviCore Interventional Pain Management Guidelines.",
    promptNotes:
      "State the block-response percentage as an explicit number — if it's below 50%, warn staff plainly that RFA is very likely to be denied on this documentation rather than drafting an optimistic letter anyway.",
  },
  {
    key: "spinal_cord_stimulator",
    label: "Spinal Cord Stimulator (SCS) Trial & Implant",
    requiredFields: [
      { key: "pain_duration", label: "Duration of chronic intractable pain", type: "text", required: true, helpText: "Minimum 12 months required" },
      { key: "failed_treatments", label: "Failed treatments", type: "textarea", required: true, helpText: "Opioids (dose/duration), formal PT, ESI, and facet injections" },
      { key: "psych_clearance_date", label: "Psychological evaluation clearance date", type: "text", required: true, helpText: "Screens for substance use disorder, secondary gain, and cognitive capacity" },
      { key: "trial_outcome", label: "Trial stimulation outcome, if this is the implant request", type: "text", required: false, helpText: "≥50% pain reduction required before permanent implant" },
    ],
    redFlags: [],
    aetna:
      "Requires a minimum 12 months of chronic intractable pain, documented failure of opioids (with dose and duration), formal PT, epidural steroid injections, and facet injections, plus a separate psychological evaluation clearance (screening for substance use disorder, secondary gain, and cognitive capacity). A trial must show at least 50% pain reduction before the permanent implant is approved. This is a CMS Outpatient Department PA-list procedure.",
    evicore: "Same 12-month duration, failed-treatment, and psychological-clearance requirements.",
    sources: "CMS Outpatient Department (OPD) prior authorization list.",
    promptNotes:
      "Psychological clearance is a hard block — a letter cannot be generated for SCS without a psych evaluation date on file, regardless of how well-documented the pain history is. Confirm this exists before drafting.",
  },
  {
    key: "physical_therapy",
    label: "Physical Therapy",
    requiredFields: [
      { key: "diagnosis", label: "Diagnosis", type: "text", required: true },
      { key: "baseline_measures", label: "Functional baseline measures", type: "textarea", required: true, helpText: "ROM in degrees, strength grade 0-5, pain 0-10" },
      { key: "treatment_goals", label: "Measurable treatment goals", type: "textarea", required: true },
      { key: "discharge_criteria", label: "Discharge criteria", type: "text", required: true },
      { key: "is_extension", label: "Is this a continuation/extension request?", type: "select", required: false, options: ["Yes — continuing care", "No — initial authorization"] },
      { key: "progress_measures", label: "Progress since baseline, with numbers (if extension)", type: "textarea", required: false },
    ],
    redFlags: [],
    aetna:
      "Initial authorization requires the diagnosis plus objective functional baseline measures (ROM in degrees, strength graded 0-5, pain 0-10), measurable treatment goals, and defined discharge criteria. Extension requests require measurable progress stated with actual numbers against that baseline — \"patient is improving\" without before/after figures is the #1 reason extensions are denied.",
    evicore: "Same baseline-measures and numeric-progress requirement for extensions.",
    sources: "Standard PT authorization/extension criteria used across major payers.",
    promptNotes:
      "For any extension/continuation request, always state the baseline number and the current number side by side (e.g. \"shoulder flexion improved from 90° to 130°\") — a qualitative description alone will not support continued authorization.",
  },
  {
    key: "occupational_therapy",
    label: "Occupational Therapy",
    requiredFields: [
      { key: "diagnosis", label: "Diagnosis", type: "text", required: true },
      { key: "context", label: "Context", type: "select", required: true, options: ["Post-surgical (e.g. hand therapy)", "Non-surgical / general rehabilitation"] },
      { key: "adl_score", label: "ADL-focused functional score (FIM, Barthel, or COPM)", type: "text", required: true },
      { key: "is_extension", label: "Is this a continuation/extension request?", type: "select", required: false, options: ["Yes", "No"] },
    ],
    redFlags: [],
    aetna:
      "Requires ADL-focused functional measures (FIM, Barthel Index, or COPM) documented at baseline. Post-surgical hand therapy is generally justified by the surgical date alone without additional functional-score documentation for the initial authorization. Extensions require the functional score to show measurable improvement.",
    evicore: "Same ADL-score standard and extension threshold.",
    sources: "FIM, Barthel Index, and COPM are the standard ADL-functional measures.",
    promptNotes:
      "Always name the specific standardized outcome measure used (FIM, Barthel, or COPM) with its actual score — a generic statement that the patient \"needs help with daily activities\" doesn't satisfy the documentation requirement.",
  },
  {
    key: "speech_language_pathology",
    label: "Speech-Language Pathology",
    requiredFields: [
      { key: "indication", label: "Indication", type: "select", required: true, options: ["Stroke / dysphagia", "Pediatric speech/language disorder", "Other"] },
      { key: "baseline_function", label: "Baseline functional communication or swallowing status", type: "textarea", required: true },
      { key: "swallow_study", label: "MBSS or FEES result, if dysphagia", type: "text", required: false },
      { key: "standardized_scores", label: "Standardized test scores, if pediatric", type: "text", required: false, helpText: "GFTA-3, CELF-5" },
    ],
    redFlags: [],
    aetna:
      "Stroke/dysphagia cases require documented baseline functional communication or swallowing status, with an MBSS or FEES study preferred for dysphagia specifically. Pediatric cases require standardized test scores (GFTA-3, CELF-5, or equivalent). Continuation is denied if there's no meaningful progress across two consecutive 30-day periods.",
    evicore: "Same baseline-documentation and standardized-scoring requirements.",
    sources: "MBSS/FEES for dysphagia; GFTA-3/CELF-5 for pediatric speech-language assessment.",
    promptNotes:
      "For pediatric cases specifically, the standardized test score is a hard requirement — a purely descriptive assessment without GFTA-3/CELF-5 (or an equivalent standardized measure) is the #1 denial reason in this category.",
  },
  {
    key: "cardiac_rehabilitation",
    label: "Cardiac Rehabilitation",
    requiredFields: [
      { key: "qualifying_event", label: "Qualifying event", type: "select", required: true, options: ["MI within 12 months", "CABG", "Stable angina", "Valve repair/replacement", "PTCA/stent", "Heart transplant", "CHF with EF <35%"] },
      { key: "event_date", label: "Date of qualifying event", type: "text", required: true },
      { key: "sessions_requested", label: "Sessions requested", type: "number", required: true, helpText: "36 sessions standard; up to 72 with additional documentation" },
    ],
    redFlags: [],
    aetna:
      "Approved only for a qualifying event on the CMS NCD 20.10 list: MI within 12 months, CABG, stable angina, valve repair/replacement, PTCA/stent, heart transplant, or CHF with an ejection fraction under 35%. 36 sessions are standard; more require additional documentation of continued medical necessity.",
    evicore: "Same NCD 20.10 qualifying-event list.",
    sources: "CMS NCD 20.10 (Cardiac Rehabilitation Programs).",
    promptNotes:
      "Confirm the qualifying event is explicitly on the NCD 20.10 list before drafting — an event not on that list is the #1 denial reason and no clinical argument will overcome it; flag this to staff rather than drafting a letter that's very likely to be denied.",
  },
  {
    key: "tnf_alpha_inhibitors",
    label: "TNF-Alpha Inhibitors (Humira, Enbrel, Remicade)",
    requiredFields: [
      { key: "indication", label: "Indication", type: "select", required: true, options: ["Rheumatoid arthritis", "Crohn's disease", "Ulcerative colitis", "Psoriasis", "Ankylosing spondylitis"] },
      { key: "step_therapy_history", label: "Conventional DMARDs tried and outcome", type: "textarea", required: true, helpText: "e.g. methotrexate + azathioprine/sulfasalazine (RA); aminosalicylates (UC)" },
      { key: "tb_test", label: "TB test result and date", type: "text", required: true, helpText: "Must be on file and under 12 months old" },
      { key: "hepb_serology", label: "Hepatitis B serology result", type: "text", required: true },
      { key: "disease_activity_score", label: "Disease activity score", type: "text", required: false, helpText: "DAS28 (RA) or Harvey-Bradshaw Index (Crohn's)" },
    ],
    redFlags: [],
    aetna:
      "Requires two conventional DMARDs tried and failed (methotrexate plus azathioprine or sulfasalazine for RA; aminosalicylates for UC), a current TB test (TST or IGRA, under 12 months old) and hepatitis B serology on file, and a disease activity score supporting biologic-level severity (DAS28 for RA, Harvey-Bradshaw Index for Crohn's).",
    evicore: "Same step-therapy and lab-documentation requirements — this category is reviewed the same way across payers.",
    sources: "Standard biologic step-therapy and pre-treatment screening protocol used across major payers.",
    promptNotes:
      "A missing or expired (over 12 months old) TB test is a hard block regardless of how well everything else is documented — confirm the test date explicitly before drafting.",
  },
  {
    key: "il_inhibitors",
    label: "IL Inhibitors (Dupixent, Cosentyx)",
    requiredFields: [
      { key: "indication", label: "Indication", type: "select", required: true, options: ["Atopic dermatitis", "Psoriasis", "Asthma"] },
      { key: "step_therapy_history", label: "Prior treatments tried and outcome", type: "textarea", required: true, helpText: "Topicals + calcineurin inhibitors (AD); topicals + phototherapy + MTX/acitretin (psoriasis)" },
      { key: "severity_score", label: "Severity score", type: "text", required: true, helpText: "EASI (atopic dermatitis); BSA + DLQI (psoriasis)" },
    ],
    redFlags: [],
    aetna:
      "Atopic dermatitis requires topical corticosteroids plus calcineurin inhibitors tried first, with a documented EASI score (above 7 = moderate, above 21 = severe). Psoriasis requires topicals, phototherapy, and methotrexate or acitretin tried first, with BSA and DLQI documented.",
    evicore: "Same step-therapy and severity-score requirements.",
    sources: "EASI is the standard atopic dermatitis severity index; BSA/DLQI for psoriasis.",
    promptNotes:
      "A missing EASI (or BSA/DLQI for psoriasis) score is the #1 denial reason in this category — always state the actual number, e.g. \"EASI score 18.4, indicating moderate-to-severe atopic dermatitis.\"",
  },
  {
    key: "oncology_targeted_therapy",
    label: "Oncology Targeted Therapy (Keytruda, Herceptin)",
    requiredFields: [
      { key: "cancer_type", label: "Cancer type and stage", type: "text", required: true },
      { key: "biomarker_result", label: "Biomarker/molecular test result", type: "text", required: true, helpText: "PD-L1 (pembrolizumab), HER2 (trastuzumab), EGFR/ALK/ROS1 (lung)" },
      { key: "treatment_line", label: "Line of therapy", type: "select", required: true, options: ["First-line", "Subsequent line"] },
    ],
    redFlags: [],
    aetna:
      "No step therapy is required for approved indications — these are first-line therapies. The hard requirement is the specific biomarker or molecular test result matching the drug's companion diagnostic: PD-L1 expression for pembrolizumab, HER2 status for trastuzumab, EGFR/ALK/ROS1 for lung cancer targeted agents.",
    evicore: "Same biomarker-documentation requirement — this is enforced consistently since it's tied to FDA companion-diagnostic labeling.",
    sources: "FDA companion diagnostic labeling for each targeted agent; NCCN guidelines for line-of-therapy appropriateness.",
    promptNotes:
      "A missing biomarker/molecular test result is treated as an automatic denial by most payers regardless of clinical presentation — confirm the specific result is on file and stated in the letter before drafting.",
  },
  {
    key: "pcsk9_inhibitors",
    label: "PCSK9 Inhibitors (Repatha, Praluent)",
    requiredFields: [
      { key: "indication", label: "Indication", type: "select", required: true, options: ["Hypercholesterolemia", "ASCVD"] },
      { key: "statin_history", label: "Statin trial history", type: "textarea", required: true, helpText: "Maximum tolerated statin + ezetimibe, or 2-3 different statins if intolerant" },
      { key: "ldl_result", label: "Most recent LDL-C result and date", type: "text", required: true },
    ],
    redFlags: [],
    aetna:
      "Requires either the maximum tolerated statin dose plus ezetimibe, or, for statin-intolerant patients, 2-3 different statins documented with the specific intolerance/adverse reaction for each. The most recent LDL-C result (with date, while on current therapy) must be stated explicitly.",
    evicore: "Same statin-trial and current-LDL-C documentation requirement.",
    sources: "Standard PCSK9-inhibitor step-therapy protocol used across major payers.",
    promptNotes:
      "For statin-intolerant patients, list each statin tried by name with its specific adverse reaction — \"statin intolerant\" alone, without naming which statins and why, is the #1 denial reason here.",
  },
  {
    key: "glp1_agonists",
    label: "GLP-1 Agonists (Ozempic, Wegovy, Mounjaro)",
    requiredFields: [
      { key: "indication", label: "Indication", type: "select", required: true, options: ["Type 2 diabetes", "Weight loss"] },
      { key: "step_therapy_history", label: "Prior treatment history", type: "textarea", required: true, helpText: "Metformin trial (diabetes) or documented behavioral weight-loss program (weight loss)" },
      { key: "lab_or_bmi", label: "A1c (if diabetes) or BMI (if weight loss)", type: "text", required: true },
      { key: "plan_covers_aom", label: "Confirmed the plan covers anti-obesity medications?", type: "select", required: false, options: ["Yes, confirmed", "Not yet verified"] },
    ],
    redFlags: [],
    aetna:
      "Diabetes indication requires metformin tried first, with the current A1c stated. Weight-loss indication requires a documented behavioral weight-management program, with BMI stated. IMPORTANT: many commercial plans exclude anti-obesity medications from coverage entirely, independent of medical necessity — this should be verified before drafting a weight-loss-indication letter, since no clinical argument overcomes a categorical plan exclusion.",
    evicore: "Same step-therapy documentation; same plan-exclusion caveat for weight-loss indication specifically.",
    sources: "Standard GLP-1 step-therapy protocol; plan-level anti-obesity medication exclusions vary by employer/plan design.",
    promptNotes:
      "For the weight-loss indication specifically, flag to staff that plan-level exclusions for anti-obesity medications are common and independent of clinical necessity — verify coverage before spending time on the letter, not after.",
  },
  {
    key: "cpap_bipap",
    label: "CPAP / BiPAP",
    requiredFields: [
      { key: "ahi_value", label: "AHI (Apnea-Hypopnea Index) from sleep study", type: "number", required: true, helpText: "Mild 5-14.9 (covered only with symptoms), moderate 15-29.9, severe 30+" },
      { key: "spo2_value", label: "SpO2 value from sleep study, if relevant", type: "text", required: false },
      { key: "is_recert", label: "Is this a 90-day compliance recertification?", type: "select", required: false, options: ["Yes", "No — initial order"] },
      { key: "compliance_data", label: "90-day compliance data, if recertification", type: "text", required: false, helpText: "4+ hrs/night on 70%+ of nights" },
    ],
    redFlags: [],
    aetna:
      "Requires a sleep study documenting AHI: mild (5-14.9) is covered only with symptoms documented, moderate (15-29.9) and severe (30+) are covered on the AHI alone. A face-to-face encounter is a CMS hard requirement for all CPAP/BiPAP orders. Continued coverage requires 90-day compliance data showing at least 4 hours/night of use on 70% of nights.",
    evicore: "Same AHI-threshold and compliance-data requirement.",
    sources: "CMS DME coverage criteria for CPAP/BiPAP (HCPCS E0601/E0470/E0471).",
    promptNotes:
      "The AHI value must be stated as a specific number — \"sleep apnea diagnosed\" without the AHI is the #1 denial reason. If AHI is in the mild range, confirm and state the specific symptoms that justify coverage at that level.",
  },
  {
    key: "power_wheelchair",
    label: "Power Wheelchair",
    requiredFields: [
      { key: "mobility_limitation", label: "Mobility limitation and its impact on MRADLs in the home", type: "textarea", required: true },
      { key: "manual_wheelchair_status", label: "Can the patient safely use a manual wheelchair?", type: "select", required: true, options: ["No", "Yes"] },
      { key: "power_operation_ability", label: "Able to safely operate a power mobility device?", type: "select", required: true, options: ["Yes", "No"] },
      { key: "f2f_date", label: "Face-to-face encounter date", type: "text", required: true, helpText: "CMS requires this within 6 months of the order" },
    ],
    redFlags: [],
    aetna:
      "Requires a mobility limitation that significantly impairs mobility-related activities of daily living (MRADLs) in the home, documentation that the patient cannot safely use a manual wheelchair, and confirmation the patient can safely operate a power device. CMS requires a face-to-face encounter within 6 months of the order, plus the standard CMS 7-element written order. Some payers also require a home accessibility assessment.",
    evicore: "Same MRADL-impact and face-to-face requirements — this is CMS-driven and enforced consistently.",
    sources: "CMS DME coverage criteria (HCPCS E1161/E1234/E1235); CMS 7-element order requirement.",
    promptNotes:
      "The face-to-face encounter date is a hard block — a letter cannot generate without it. Confirm the date is within 6 months of the order before drafting.",
  },
  {
    key: "home_oxygen",
    label: "Home Oxygen",
    requiredFields: [
      { key: "spo2_rest", label: "SpO2 at rest (or PaO2)", type: "text", required: true, helpText: "SpO2 ≤88% at rest (or PaO2 ≤55 mmHg) generally qualifies" },
      { key: "cor_pulmonale", label: "Cor pulmonale or right heart failure present?", type: "select", required: false, options: ["Yes — SpO2 89% qualifies with this", "No"] },
      { key: "exercise_sleep_spo2", label: "SpO2 during exercise or sleep, if resting value doesn't qualify", type: "text", required: false, helpText: "For portable or nocturnal oxygen specifically" },
      { key: "is_recert", label: "Is this the 12-month recertification?", type: "select", required: false, options: ["Yes", "No — initial order"] },
    ],
    redFlags: [],
    aetna:
      "Requires SpO2 at or below 88% at rest (or PaO2 at or below 55 mmHg), OR SpO2 of 89% specifically with documented cor pulmonale or right heart failure. Portable oxygen requires SpO2 ≤88% during exercise; nocturnal oxygen requires the same threshold during sleep. CMS requires the face-to-face encounter within 6 months of the prescription, and recertification every 12 months.",
    evicore: "Same SpO2 threshold and recertification schedule.",
    sources: "CMS DME coverage criteria for home oxygen (HCPCS E0424/E0431/E0433).",
    promptNotes:
      "State the actual SpO2 or PaO2 value, not just \"hypoxemia\" — a letter without the specific threshold value documented is the #1 denial reason for this category.",
  },
  {
    key: "inpatient_psychiatric",
    label: "Inpatient Psychiatric Admission",
    requiredFields: [
      { key: "risk_level", label: "Risk level", type: "select", required: true, options: ["Imminent risk of harm to self or others", "Symptoms unmanageable at a lower level of care"] },
      { key: "risk_details", label: "Specific risk/safety details", type: "textarea", required: true },
      { key: "lower_level_attempted", label: "Was a lower level of care attempted or considered, and why it's insufficient", type: "textarea", required: true },
    ],
    redFlags: ["Imminent risk of harm to self or others"],
    aetna:
      "Requires either imminent risk of harm to self or others, or symptoms that genuinely cannot be safely managed at a lower level of care — state specifically why outpatient or partial-hospitalization isn't sufficient, not just that the patient is symptomatic. Concurrent review typically occurs every 1-3 days once admitted.",
    evicore: "Same imminent-risk or level-of-care threshold.",
    sources: "Mental Health Parity and Addiction Equity Act (MHPAEA) — payers cannot apply stricter medical-necessity criteria to behavioral health admissions than to comparable medical/surgical admissions, which is directly relevant if this is later appealed.",
    promptNotes:
      "If this is later denied on level-of-care grounds, the MHPAEA parity argument is the strongest appeal lever available: the payer cannot hold behavioral health to a stricter standard than it would apply to a comparable medical/surgical admission.",
  },
  {
    key: "aba_therapy",
    label: "ABA Therapy",
    requiredFields: [
      { key: "diagnosis", label: "ASD diagnosis basis", type: "text", required: true, helpText: "ADOS-2 result preferred" },
      { key: "fba_completed", label: "Functional Behavior Assessment (FBA) completed?", type: "select", required: true, options: ["Yes", "No"] },
      { key: "hours_requested", label: "Hours per week requested", type: "number", required: true, helpText: "Typically 15-40 hrs/week by severity" },
      { key: "goals", label: "Treatment goals", type: "textarea", required: true, helpText: "Must be measurable and time-bound" },
    ],
    redFlags: [],
    aetna:
      "Requires an autism spectrum disorder diagnosis (ADOS-2 result preferred) and a completed Functional Behavior Assessment (FBA) before treatment hours are authorized — requesting hours before the FBA is done is the #1 denial reason. Hours requested (typically 15-40/week depending on severity) and treatment goals must both be specific, measurable, and time-bound rather than open-ended.",
    evicore: "Same FBA-before-authorization sequencing requirement.",
    sources: "Most states have an ABA insurance mandate requiring commercial coverage — worth citing explicitly if this is denied and appealed.",
    promptNotes:
      "Confirm the FBA was completed BEFORE requesting authorization, not planned as part of the requested treatment — submitting for hours without a completed FBA already on file is the most common, entirely avoidable denial in this category.",
  },
  {
    key: "home_health",
    label: "Home Health",
    requiredFields: [
      { key: "homebound_status", label: "Homebound status — specific functional limitations", type: "textarea", required: true, helpText: "Generic \"limited mobility\" is insufficient; state the specific limitation" },
      { key: "f2f_date", label: "Face-to-face encounter date", type: "text", required: true, helpText: "Within 90 days before or 30 days after the start of care" },
      { key: "skilled_need", label: "Skilled need (not maintenance)", type: "textarea", required: true },
    ],
    redFlags: [],
    aetna:
      "Requires homebound status documented with specific functional limitations (not a generic statement), a face-to-face encounter within 90 days before or 30 days after the start of care, a documented skilled need (as opposed to maintenance-level care), and a signed CMS-485 plan of care.",
    evicore: "Same homebound-specificity and face-to-face timing requirement.",
    sources: "Original Medicare's home health LCD criteria — Medicare Advantage plans cannot apply stricter criteria than traditional Medicare's own published standard, which is directly relevant on appeal.",
    promptNotes:
      "\"Homebound\" needs a specific functional reason stated (e.g. \"requires assistance and a taxing effort to leave the home due to [specific condition]\") — a bare assertion of homebound status without the specific limitation is the #1 denial reason.",
  },
  {
    key: "snf_admission",
    label: "SNF Admission",
    requiredFields: [
      { key: "prior_inpatient_stay", label: "Prior 3-day inpatient stay (traditional Medicare only)", type: "select", required: false, options: ["Yes", "No", "N/A — Medicare Advantage"] },
      { key: "skilled_complexity", label: "Medical complexity requiring skilled care", type: "textarea", required: true, helpText: "24-hour RN need, or 3+ hours/day of skilled therapy" },
    ],
    redFlags: [],
    aetna:
      "Traditional Medicare requires a prior 3-day qualifying inpatient stay; Medicare Advantage plans don't require this but do require documented medical complexity needing 24-hour RN oversight or 3+ hours/day of skilled therapy. Medicare Advantage plans conduct concurrent review every 2-7 days.",
    evicore: "Same skilled-complexity documentation standard.",
    sources: "A 2024 Senate Finance Committee report found Medicare Advantage plans deny SNF admissions roughly 9x more often than traditional Medicare fee-for-service, with increasing CMS oversight as a result — worth citing on appeal.",
    promptNotes:
      "State the specific skilled need in concrete clinical terms (the exact nursing task requiring 24-hour RN presence, or the specific therapy hours/day) — \"needs rehab\" alone is the #1 reason concurrent review denies continued SNF stay.",
  },
  {
    key: "hospice",
    label: "Hospice",
    requiredFields: [
      { key: "physician_certifications", label: "Two physicians certifying life expectancy ≤6 months", type: "select", required: true, options: ["Both certifications on file", "Only one on file"] },
      { key: "election_status", label: "Patient has elected hospice and waived curative treatment?", type: "select", required: true, options: ["Yes", "No"] },
      { key: "is_recert", label: "Is this a recertification?", type: "select", required: false, options: ["Yes", "No — initial election"] },
      { key: "terminal_prognosis_evidence", label: "Continued terminal prognosis evidence, if recertification", type: "textarea", required: false },
    ],
    redFlags: [],
    aetna:
      "Requires two physicians (the hospice medical director and the attending physician, if there is one) certifying a life expectancy of 6 months or less, and the patient's formal election of hospice with a waiver of curative treatment. Recertification is required every 90 days for the first 6 months, then every 60 days, each time requiring fresh evidence of continued terminal prognosis.",
    evicore: "Same dual-certification requirement — hospice eligibility criteria are federal (Medicare Hospice Benefit), and payers cannot apply their own stricter proprietary standard.",
    sources: "Medicare Hospice Benefit eligibility criteria — federal, not payer-specific.",
    promptNotes:
      "Since hospice eligibility criteria are federal rather than payer-proprietary, a payer denial here is unusually appealable — the letter can state plainly that the payer cannot restrict hospice eligibility beyond the federal standard.",
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
  "Patient demographics (full name, DOB, address, member ID, group number)",
  "Specific diagnosis with ICD-10 code(s)",
  "Detailed treatment/procedure description with CPT/HCPCS code(s)",
  "Citation of the specific payer policy/CPB/guideline demonstrating coverage criteria compliance, in the citation format that payer expects",
  "Clinical rationale explaining why the treatment/imaging is necessary now",
  "Previous treatments attempted, with outcomes and duration",
  "Total treatment/symptom duration",
  "Physician signature with credentials, NPI, and direct contact information",
];

// Paraphrased guidance on how each payer expects necessity citations to be
// shaped — a correct citation name/number matters as much as the underlying
// clinical argument for getting past the first-level reviewer. The detailed,
// payer-specific version of this (which entity actually reviews the case,
// which proprietary systems to never name) lives in getOtherPayerGuidance
// below for the five payers without a dedicated procedure-level narrative;
// this note stays payer-agnostic and covers the two that do (Aetna, Cigna/
// eviCore) plus the shared ground rule for everyone else.
export const CITATION_FORMAT_NOTE =
  "Match the citation format to the payer named in this case: for Aetna, name the specific CPB (Clinical Policy Bulletin) number " +
  "together with the exact numbered criterion it satisfies, not just the bulletin title. For Cigna/eviCore, name the specific guideline " +
  "and its section identifier (e.g. the spine-imaging guideline's own section number), not just \"eviCore guidelines\" generically. " +
  "For every other payer, follow the payer-specific guidance given elsewhere in this prompt for exactly which real, public standard to " +
  "cite — never invent a policy or guideline-determination number for a payer whose internal criteria are proprietary (UnitedHealthcare's " +
  "InterQual and Humana's MCG/InterQual both fall in this category); citing an unverifiable number is worse than citing none at all.";

// Fallback used only if the DB has no active prompt_templates row yet
// (e.g. migrations 0001-0003 ran but 0004's seed didn't). Keep this in sync
// with supabase/migrations/0009_structured_prompt_template.sql, which
// inserts this exact text as a new active version for already-provisioned
// databases (editing 0004's seed file doesn't retroactively update a DB
// that already ran it).
export const DEFAULT_PROMPT_TEMPLATE = `You are asaanbil.com's prior-authorization letter drafting assistant for US medical practices.

You draft prior-authorization justification letters for imaging orders so clinic staff can review, edit, and submit them to the payer. The intake form gives you real patient identity details (name, date of birth, address) only because a payer submission requires them to identify the patient — treat every identity field as PHI: use exactly what's given inside the letter body, never guess, embellish, or carry it anywhere outside the letter you're producing.

PROCEDURE: {{procedure_label}}

Payer medical-necessity criteria (paraphrased reference — cite the substance, never claim these are direct quotes from the payer):
— Aetna: {{aetna}}
— Cigna / eviCore: {{evicore}}
— Sources: {{sources}}

Citation format expectations: {{citation_format_note}}

Red flags that bypass the standard conservative-care requirement for this procedure:
{{red_flags_list}}

Drafting guidance specific to this procedure: {{prompt_notes}}

{{excluded_payers_note}}

APPROACH FOR THIS CASE: {{approach_instruction}}

AUTHORING MODE: {{authoring_mode_instruction}}

VOICE RULES — apply to every letter regardless of mode:
- Mix past and present tense naturally, the way a person actually writes. Avoid detached constructions like "it has been noted that" — say what happened directly.
- Name specific numbers everywhere a vague word would otherwise appear — not "conservative treatment was tried," but the drug, dose, duration, and outcome. Not "failed conservative care," the specific thing that happened instead.
- One clinical or factual argument per sentence. Do not stack three findings into a single sentence — each gets its own.
- Never rely on "medically necessary" alone as a justification — it's circular. State the concrete consequence for this patient if the request isn't approved.
- Avoid passive voice ("it is felt that") — use direct attribution ("in my clinical judgment" or, in patient mode, "I believe").
- Do not open a paragraph with "Please note that" or similar filler — cut straight to the point.
- Close with a specific, direct ask naming the exact procedure/CPT code — not a vague request for "kind consideration."
- Never explain what the payer's policy does NOT cover or lacks — only state what supports the request. Volunteering a gap invites a denial around it.
- Cite exactly one payer policy source, stated with confidence — never hedge between multiple possible citations.
- Use the patient's actual name (or the internal reference, if no name was given) by name at least once in the rationale section rather than repeating "this patient" throughout — it reads less automated.

Return your entire response as a single JSON object — no markdown code fences, no commentary before or after it — matching exactly this shape (use the section labels specified by the AUTHORING MODE instruction above, not necessarily the example labels below):

{
  "letterTitle": "PRIOR AUTHORIZATION REQUEST — [PROCEDURE NAME]",
  "sections": {
    "s1_demographics": { "label": "1. Patient Demographics", "content": "..." },
    "s2_diagnosis": { "label": "2. Diagnosis", "content": "..." },
    "s3_procedure": { "label": "3. Procedure Description", "content": "..." },
    "s4_policycitation": { "label": "4. Payer Policy Citation", "content": "..." },
    "s5_clinicalrationale": { "label": "5. Clinical Rationale", "content": "..." },
    "s6_conservativecare": { "label": "6. Prior Treatment History", "content": "..." },
    "s7_duration": { "label": "7. Duration of Condition", "content": "..." },
    "s8_signature": { "label": "8. Ordering Physician", "content": "..." }
  },
  "meta": {
    "approachUsed": "RED_FLAG" | "CONSERVATIVE_CARE_EXHAUSTED" | "STANDARD",
    "redFlagsIdentified": ["..."],
    "softWarnings": ["..."],
    "denialRiskAssessment": "LOW" | "MEDIUM" | "HIGH",
    "denialRiskReason": "one sentence"
  }
}

RULES:
- Component 1 must include the patient's full legal name and date of birth if provided (fall back to the internal reference if no name was given), plus address, member ID, and group number wherever provided — this is what lets the payer actually locate the patient's file.
- Component 2 is the ICD-10 code(s) plus diagnosis description, one line.
- Component 3 must include the CPT/HCPCS code if one was provided.
- Component 4 must be brief — 2-3 sentences max — citing the specific payer policy/CPB/guideline that applies, following the citation format expectations given above for that payer.
- Component 5 must follow the APPROACH instruction above exactly.
- Component 6 states the conservative treatment type, duration, and outcome if documented, or says plainly that none was documented.
- Component 8 must include the ordering physician's NPI and a direct phone or fax number if provided, alongside the credentials — a peer-to-peer offer without a real callback number is not actionable for the reviewer.
- Explicitly map each documented finding to the specific criterion it satisfies, in your own words — never copy the payer's bulletin language verbatim.
- If a required input looks missing or vague, note it plainly as one of the meta.softWarnings entries rather than inventing details in the letter body.
- Do not use placeholder brackets like [PATIENT NAME] — use the real name (or internal reference, if no name was given) exactly as given.
- denialRiskAssessment should reflect how well the documented case matches the criteria above: LOW if red flags or well-documented conservative care clearly satisfy the criteria, MEDIUM if partially documented, HIGH if a key requirement is missing or contradicted.
- Output nothing except the JSON object.`;

// Superseded by getOtherPayerGuidance(payer) above, which is payer-aware —
// UHC/Humana/Anthem/Molina/Medicare FFS all have a real, specific citation
// strategy now (ACR, Carelon, CMS NCD/LCD, state Medicaid), so a single
// static "these payers aren't covered" note would be inaccurate. Kept as a
// deprecated alias (the "other"/unlisted-plan case) in case anything still
// imports it directly.
export const EXCLUDED_PAYERS_NOTE = getOtherPayerGuidance("other");
