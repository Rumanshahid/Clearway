import type { Database } from "@/lib/database.types";

type PatientAccountRow = Database["public"]["Tables"]["patient_accounts"]["Row"];
type PatientProfileRow = Database["public"]["Tables"]["patient_profiles"]["Row"];

// Identity + consent (collected at signup) are always complete the moment
// an account exists -- everything else lives in patient_profiles and is
// optional, filled in over time from the "Complete Your Profile" prompt.
const PROFILE_FIELDS: (keyof PatientProfileRow)[] = [
  "address",
  "city",
  "state",
  "zip",
  "preferred_language",
  "preferred_contact_method",
  "emergency_contact_name",
  "emergency_contact_phone",
  "emergency_contact_relationship",
  "insurance_company",
  "plan_type",
  "member_id",
  "group_number",
  "plan_name",
  "known_drug_allergies",
  "current_medications",
  "medical_history",
];

export function calculateProfileCompletion(
  account: Pick<PatientAccountRow, "first_name" | "last_name" | "dob" | "mobile_phone">,
  profile: PatientProfileRow | null
): number {
  const identityDone = Boolean(account.first_name && account.last_name && account.dob && account.mobile_phone);
  const identityWeight = 20;

  const filled = profile ? PROFILE_FIELDS.filter((f) => profile[f]).length : 0;
  const profileWeight = 80 * (filled / PROFILE_FIELDS.length);

  return Math.round((identityDone ? identityWeight : 0) + profileWeight);
}
