// Insurance eligibility verification (e.g. via Availity) at booking time.
//
// Unlike Daily.co (telehealth.ts), this is NOT a self-serve API — Availity
// requires a business partnership/enrollment process before any credentials
// work, and the exact request/response shape depends on what that
// partnership grants access to. This function is a real integration point
// (wired into the booking flow, storing a genuine status on the appointment)
// but its body is a placeholder until those credentials exist: it always
// returns "unavailable" so nothing is fabricated. Once a real Availity
// integration exists, replace the body below with the actual eligibility
// API call and keep the same return shape.
export type EligibilityCheckResult = "verified" | "not_verified" | "unavailable";

export async function checkInsuranceEligibility(params: {
  insuranceCompany: string | null;
  memberId: string | null;
}): Promise<EligibilityCheckResult> {
  if (!process.env.AVAILITY_CLIENT_ID || !process.env.AVAILITY_CLIENT_SECRET) {
    return "unavailable";
  }
  if (!params.insuranceCompany || !params.memberId) {
    return "unavailable";
  }

  // No real Availity call is implemented -- see the module comment above.
  return "unavailable";
}
