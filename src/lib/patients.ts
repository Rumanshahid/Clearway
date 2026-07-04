// Shared option lists and section definitions for the patient roster —
// used by both the intake form (PatientForm) and the CSV bulk-importer so
// the two stay in sync.

export const INSURANCE_COMPANIES = [
  "Aetna",
  "Cigna",
  "UnitedHealthcare",
  "Humana",
  "BCBS (state)",
  "Medicare Advantage",
  "Medicaid MCO",
  "Other",
];

export const PLAN_TYPES = [
  "Commercial PPO",
  "Commercial HMO",
  "Medicare Advantage",
  "Medicaid Managed Care",
  "ACA Marketplace",
  "Self-funded employer plan",
  "Other",
];

export const GENDERS = ["Male", "Female", "Other"];
export const PATIENT_STATUSES = ["active", "inactive", "deceased"] as const;
export const PREFERRED_CONTACT_METHODS = ["Phone", "Email", "Text"];
export const BEST_TIME_TO_CALL = ["Morning", "Afternoon", "Evening"];
export const RELATIONSHIPS = ["Spouse", "Parent", "Child", "Other"];
export const CONSENT_METHODS = ["Verbal", "Written", "Electronic", "On File"];
export const COB_ORDERS = ["Primary", "Secondary"];
export const SPECIAL_HANDLING_FLAGS = ["VIP patient", "Language barrier", "Legal hold", "Minor", "Hospice patient"];

export interface PatientSectionDef {
  key: string;
  label: string;
  defaultVisible: boolean;
}

// Section 4 (Secondary Insurance) is a single toggle rather than a section
// with its own "More options" — kept out of this list, handled inline in
// PatientForm.
export const PATIENT_SECTIONS: PatientSectionDef[] = [
  { key: "identity", label: "Patient Identity", defaultVisible: true },
  { key: "contact", label: "Contact Information", defaultVisible: true },
  { key: "insurance", label: "Primary Insurance", defaultVisible: true },
  { key: "secondary_insurance", label: "Secondary Insurance", defaultVisible: false },
  { key: "clinical", label: "Clinical & Physician", defaultVisible: false },
  { key: "consent", label: "HIPAA Consent", defaultVisible: false },
  { key: "notes", label: "Practice-Internal Notes", defaultVisible: false },
];

// Column headers for the CSV bulk-import template — matches the default
// (non-"More options") fields plus a few high-value optional ones. Header
// matching in the importer is case-insensitive and ignores spaces/underscores.
export const PATIENT_CSV_COLUMNS = [
  "first_name",
  "middle_name",
  "last_name",
  "dob",
  "gender",
  "ssn_last4",
  "preferred_language",
  "phone",
  "mobile_phone",
  "email",
  "address",
  "city",
  "state",
  "zip",
  "insurance_company",
  "plan_type",
  "state_of_plan",
  "member_id",
  "group_number",
  "plan_name",
] as const;

export const PATIENT_CSV_SAMPLE_ROW = [
  "James",
  "R",
  "Coleman",
  "1967-09-14",
  "Male",
  "1104",
  "English",
  "555-201-4471",
  "555-201-9902",
  "james.coleman@example.com",
  "412 Oak Street",
  "Austin",
  "TX",
  "78701",
  "Aetna",
  "Commercial PPO",
  "TX",
  "448-229-1104",
  "AET-77443",
  "Aetna Select EPO Plan",
];

export function buildPatientCsvTemplate(): string {
  const escape = (v: string) => (v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v);
  return [PATIENT_CSV_COLUMNS.join(","), PATIENT_CSV_SAMPLE_ROW.map(escape).join(",")].join("\n");
}
