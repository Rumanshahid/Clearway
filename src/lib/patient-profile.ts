import type { Database } from "@/lib/database.types";

type PatientProfileRow = Database["public"]["Tables"]["patient_profiles"]["Row"];

// Matches the 3-step signup wizard's own fields as the guaranteed 20% base
// (account credentials + identity are already on file the moment the
// account exists), then the self-service profile fields fill the rest.
const PROFILE_COMPLETION_FIELDS: (keyof PatientProfileRow)[] = [
  "address",
  "city",
  "state",
  "zip",
  "preferred_language",
  "emergency_contact_name",
  "emergency_contact_phone",
  "insurance_company",
  "member_id",
  "preferred_contact_method",
];

export function calculateProfileCompletion(profile: PatientProfileRow | null): number {
  if (!profile) return 20;
  const filled = PROFILE_COMPLETION_FIELDS.filter((key) => {
    const value = profile[key];
    return value !== null && value !== undefined && String(value).trim() !== "";
  }).length;
  return Math.round(20 + (filled / PROFILE_COMPLETION_FIELDS.length) * 80);
}
