import type { LetterApproach } from "@/lib/database.types";
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

// Non-blocking warnings shown to staff alongside the letter — unlike missing
// required fields (which block generation entirely), these are things that
// commonly hurt approval odds but don't stop drafting.
export function checkSoftWarnings(procedure: ProcedureCriteria, payer: PayerKey, caseFields: Record<string, string>): string[] {
  const warnings: string[] = [];

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
