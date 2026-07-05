import type { AuthoringMode, LetterApproach } from "@/lib/database.types";
import type { PayerKey, ProcedureCriteria } from "@/lib/criteria";

export interface LetterApproachResult {
  approach: LetterApproach;
  instruction: string;
}

// Which narrative should lead the clinical rationale, based on what the
// intake actually documented. Red flags always win — they legitimately
// bypass the conservative-care requirement per the payer criteria.
export function determineLetterApproach(redFlags: string[], caseFields: Record<string, string>): LetterApproachResult {
  if (redFlags.length > 0) {
    return {
      approach: "RED_FLAG",
      instruction:
        `Lead the clinical rationale (component 5) with these red flags, in the patient's own documented terms: ${redFlags.join("; ")}. ` +
        "State explicitly that these findings bypass the standard conservative-care requirement — do not bury them after a conservative-care narrative.",
    };
  }

  const conservativeCareEntry = Object.entries(caseFields).find(
    ([key, value]) => key.toLowerCase().includes("conservative") && value?.trim()
  );

  if (conservativeCareEntry) {
    return {
      approach: "CONSERVATIVE_CARE_EXHAUSTED",
      instruction:
        `No red flags are present, so this letter's approval hinges entirely on conservative-care documentation: "${conservativeCareEntry[1]}". ` +
        "Make the type, duration, and outcome of that treatment the central justification in component 5, mapped explicitly to the payer's conservative-care threshold for this procedure.",
    };
  }

  return {
    approach: "STANDARD",
    instruction:
      "No red flags and no conservative-care treatment were documented. Draft the letter from the clinical findings actually provided, but flag the missing conservative-care history explicitly as a Documentation Gap — this is the most common reason letters like this get denied.",
  };
}

// The two authoring modes change voice, pronouns, and section headings —
// not the underlying facts. Doctor mode is clinical and carries a physician
// attestation; patient mode is plain-English and leads with functional
// impact, with the physician's statement referenced as an attached enclosure.
export function buildAuthoringModeInstruction(mode: AuthoringMode): string {
  if (mode === "patient") {
    return `Write this letter in PATIENT-AUTHORED mode. The patient is filing this themselves — write entirely in their first person voice ("I have had...", "I am asking...").
Use plain English throughout — no clinical jargon, Latin terms, or drug names the patient wouldn't naturally use. Lead the rationale with functional, daily-life impact (what they can no longer do), not clinical findings.
Refer to the ordering physician's clinical statement as an attached enclosure supporting the request, rather than presenting clinical findings as if the patient personally observed them.
Use these section headings instead of the clinical ones: 1. My Information and Insurance / 2. My Diagnosis / 3. What I Am Asking to Have Covered / 4. Why My Plan Should Cover This / 5. How This Condition Affects My Daily Life / 6. Treatments I Have Already Tried / 7. How Long I Have Had This Problem / 8. My Doctor's Information and Statement.
Component 8 should read as the patient identifying their doctor and referencing the enclosed physician statement, not as a physician attestation.`;
  }

  return `Write this letter in DOCTOR-AUTHORED mode. Write entirely in the ordering physician's first person voice ("I am requesting...", "In my clinical judgment..."). Clinical language, specific measurements, and named medications/doses are expected and should be used naturally.
Component 8 must close with a physician attestation of accuracy and an explicit offer of a peer-to-peer call, even if one wasn't requested — this is standard practice and increases reviewer responsiveness.
Use the standard clinical section headings: 1. Patient Demographics / 2. Diagnosis / 3. Procedure Description / 4. Payer Policy Citation / 5. Clinical Rationale / 6. Prior Treatment History / 7. Duration of Condition / 8. Ordering Physician.`;
}

// Non-blocking warnings shown to staff alongside the letter — unlike missing
// required fields (which block generation entirely), these are things that
// commonly hurt approval odds but don't stop drafting.
export function checkSoftWarnings(
  procedure: ProcedureCriteria,
  payer: PayerKey,
  caseFields: Record<string, string>,
  extras?: {
    insuranceGroupNumber?: string;
    orderingPhysicianSpecialty?: string;
    orderingPhysicianFax?: string;
    eligibilityStatus?: string;
    eligibilityStale?: boolean;
  }
): string[] {
  const warnings: string[] = [];

  if (!extras?.insuranceGroupNumber) {
    warnings.push("Insurance group number wasn't provided — many payers require it alongside the member ID to locate the policy.");
  }
  if (!extras?.orderingPhysicianFax) {
    warnings.push("Ordering physician fax wasn't provided — some payers still require a fax number for PA correspondence.");
  }
  if (!extras?.orderingPhysicianSpecialty) {
    warnings.push("Ordering physician specialty wasn't provided — useful if this case ends up needing a peer-to-peer review.");
  }
  if (!extras?.eligibilityStatus) {
    warnings.push("No insurance eligibility check is on file for this patient — verify coverage is active before submitting.");
  } else if (extras.eligibilityStatus === "Inactive") {
    warnings.push("This patient's last eligibility check showed coverage as Inactive — confirm current status before submitting.");
  } else if (extras.eligibilityStale) {
    warnings.push("This patient's eligibility was last verified over 30 days ago — re-verify before submitting.");
  }

  if (payer === "other") {
    warnings.push("This payer has no published medical-necessity criteria on file — the letter will rely on general clinical necessity and red-flag/conservative-care logic instead of a cited policy.");
  }

  const priorImagingEntry = Object.entries(caseFields).find(([key]) => key.toLowerCase().includes("prior_imaging"));
  if (priorImagingEntry && !priorImagingEntry[1]?.trim()) {
    warnings.push("Prior imaging (e.g. X-ray) isn't documented — its absence is a common, avoidable denial reason for this procedure.");
  }

  for (const field of procedure.requiredFields) {
    if (!field.required && !caseFields[field.key]?.trim()) {
      warnings.push(`"${field.label}" wasn't provided — optional, but including it usually strengthens the letter.`);
    }
  }

  return warnings;
}
