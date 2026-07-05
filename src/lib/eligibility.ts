// Insurance eligibility verification. No real-time clearinghouse (Availity,
// Change Healthcare/Optum, Waystar, pVerify, etc.) is connected — that
// requires a signed business account and API credentials this codebase
// can't provision on its own. Today this is a manual log: staff verify
// coverage themselves (payer portal or phone) and record the result.
//
// checkEligibilityViaClearinghouse below is a placeholder for exactly one
// real integration, kept separate from the manual-log path so wiring one up
// later doesn't require touching the patient page or the request form —
// only this function's body and the ELIGIBILITY_METHODS list below.

export const ELIGIBILITY_STATUSES = ["Active", "Inactive", "Unknown"] as const;
export type EligibilityStatus = (typeof ELIGIBILITY_STATUSES)[number];

export const ELIGIBILITY_METHODS = ["Payer portal", "Phone call", "Other"];

// A check older than this is treated as stale for the purposes of the New
// Request warning and the letter's soft-warnings — coverage can lapse or
// change between visits, so "verified once, months ago" isn't good enough.
export const ELIGIBILITY_STALE_DAYS = 30;

export function isEligibilityStale(checkedAt: string | null | undefined): boolean {
  if (!checkedAt) return true;
  const days = (Date.now() - new Date(checkedAt).getTime()) / 86400000;
  return days > ELIGIBILITY_STALE_DAYS;
}

export interface ClearinghouseEligibilityResult {
  status: EligibilityStatus;
  planType?: string;
  deductibleRemaining?: number;
  copayAmount?: number;
}

// Not implemented — no clearinghouse account is configured. Throws instead
// of returning a fabricated result, since a wrong "Active" here could lead
// to a practice performing an uncovered service. Wire up a real provider's
// 270/271 eligibility API here when one is under contract.
export async function checkEligibilityViaClearinghouse(): Promise<ClearinghouseEligibilityResult> {
  throw new Error(
    "No real-time eligibility provider is configured. Verify coverage via the payer's portal or a phone call, and log the result manually."
  );
}
