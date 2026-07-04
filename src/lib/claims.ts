// Claims denial routing table, deadline estimates, and option lists.
// Paraphrased, not copied from any payer or CMS document — see criteria.ts's
// note on the same requirement for PA content.

export interface DenialRouting {
  code: string;
  reason: string;
  letterType: string;
  instruction: string;
  isAdminIssue: boolean;
}

export const DENIAL_ROUTING: DenialRouting[] = [
  {
    code: "CO-197",
    reason: "No prior authorization obtained",
    letterType: "Retrospective Authorization Request",
    instruction:
      "Draft this as a retrospective authorization request — argue that the service met medical necessity criteria at the time it was performed, even though authorization wasn't obtained first. Explain briefly why PA wasn't secured in advance if that context is documented (e.g. emergency circumstances).",
    isAdminIssue: false,
  },
  {
    code: "CO-198",
    reason: "Prior authorization exceeded (visit/day limit)",
    letterType: "Concurrent Review Extension Request",
    instruction:
      "Draft this as a concurrent review extension request — document clinical progress against objective measures, the updated treatment plan, and a defined endpoint, to justify continuing care beyond the original authorization.",
    isAdminIssue: false,
  },
  {
    code: "CO-27",
    reason: "Coverage expired / not active on date of service",
    letterType: "Coverage Verification Letter",
    instruction:
      "This is an administrative issue, not a clinical one — draft a short cover letter asking the payer to re-verify coverage status on the date of service, referencing the claim and member ID. Do not argue clinical necessity.",
    isAdminIssue: true,
  },
  {
    code: "CO-16",
    reason: "Missing information on the claim",
    letterType: "Corrected Claim Cover Letter",
    instruction:
      "This is an administrative issue — draft a brief cover letter for a corrected claim resubmission, noting what was added or corrected. Do not argue clinical necessity; this is a documentation-completeness issue, not a coverage dispute.",
    isAdminIssue: true,
  },
  {
    code: "MEDICAL_NECESSITY",
    reason: "Medical necessity / clinical documentation insufficient",
    letterType: "First-Level Clinical Appeal",
    instruction:
      "Draft a full clinical appeal citing the payer's specific medical-necessity policy and mapping the documented clinical findings to it point by point, the same standard as a PA justification letter.",
    isAdminIssue: false,
  },
  {
    code: "STEP_THERAPY",
    reason: "Required step-therapy alternatives not tried",
    letterType: "Step Therapy Exception Request",
    instruction:
      "Draft a step-therapy exception request — document the specific alternative treatment(s) already tried and their outcome, or the specific clinical contraindication to trying them, per the payer's step-therapy policy.",
    isAdminIssue: false,
  },
  {
    code: "EXPERIMENTAL",
    reason: "Service considered experimental / investigational",
    letterType: "Appeal with Literature Support",
    instruction:
      "Draft an appeal that leans on named peer-reviewed literature, an FDA approval/clearance, or a specialty-society guideline to argue the service is standard of care, not experimental — cite the specific supporting source named in the case details.",
    isAdminIssue: false,
  },
  {
    code: "DUPLICATE",
    reason: "Flagged as a duplicate claim",
    letterType: "Corrected Claim with Unique Identifier",
    instruction:
      "This is an administrative issue — draft a brief cover letter clarifying this is not a duplicate (e.g. a distinct date of service or unique claim identifier), for a corrected resubmission. Do not argue clinical necessity.",
    isAdminIssue: true,
  },
];

export function getDenialRouting(code: string): DenialRouting {
  return (
    DENIAL_ROUTING.find((d) => d.code === code) || {
      code,
      reason: "Unlisted denial reason",
      letterType: "General Appeal",
      instruction: "Draft a general appeal addressing the denial reason as described in the case details.",
      isAdminIssue: false,
    }
  );
}

// Standard-timeline appeal windows in days, keyed by the same payer names
// used in lib/patients.ts's INSURANCE_COMPANIES — sourced from the same
// paraphrased DEADLINE_REFERENCE data already shown on the Resources page.
// Where the real rule varies by state/plan, this is a conservative estimate
// staff should verify, not a guarantee.
export const APPEAL_DEADLINE_DAYS: Record<string, number> = {
  Aetna: 180,
  Cigna: 180,
  UnitedHealthcare: 65,
  Humana: 60,
  "BCBS (state)": 180,
  "Medicare Advantage": 60,
  "Medicaid MCO": 90,
  Other: 180,
};

export function estimateAppealDeadline(denialDate: string, payer: string): string | null {
  if (!denialDate) return null;
  const days = APPEAL_DEADLINE_DAYS[payer] ?? APPEAL_DEADLINE_DAYS.Other;
  const date = new Date(denialDate);
  if (Number.isNaN(date.getTime())) return null;
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export const PA_OBTAINED_OPTIONS = ["Yes", "No", "Yes but expired", "Yes but wrong code"];
export const APPEAL_TYPES = ["First-level internal", "Expedited", "External review"];
export const PRIORITIES = ["Standard", "Urgent"];
export const FILING_METHODS = ["Portal", "Fax", "Mail"];
export const DENIAL_STATUSES = ["open", "appeal_filed", "won", "lost"] as const;
