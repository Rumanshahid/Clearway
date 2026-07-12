// Paraphrased reference data — denial-code guidance, payer appeal deadlines,
// and source summaries. Rewritten in original wording, not quoted from any
// source. Shown on the Resources page and used to seed the tips rotator.

export const DENIAL_GUIDE: { reason: string; fix: string; action: string }[] = [
  { reason: "Not medically necessary (CO-50)", fix: "Formal appeal", action: "Add new clinical evidence and cite a specialty-society guideline directly." },
  { reason: "Conservative care not documented (CO-50)", fix: "Formal appeal", action: "Document the specific treatments tried, exact doses, durations, and outcomes." },
  { reason: "Step therapy required (CO-96)", fix: "Step-therapy exception request", action: "Prove the required step drug(s) were tried and failed, or are contraindicated — records from a prior insurer still count." },
  { reason: "Experimental / investigational (CO-96)", fix: "Formal appeal", action: "Cite peer-reviewed literature, an FDA approval, or a specialty-society guideline (e.g. an NCCN Category 1 recommendation)." },
  { reason: "Missing documentation (CO-16)", fix: "Corrected claim, not an appeal", action: "Attach the missing record and resubmit — this is an administrative fix, not a clinical dispute." },
  { reason: "Wrong CPT code (CO-4)", fix: "Corrected claim, not an appeal", action: "Correct the code and resubmit using UB-04 Frequency Code 7, or it will process as a duplicate and deny again." },
  { reason: "Flagged as duplicate (CO-18)", fix: "Corrected claim, not an appeal", action: "Clarify the distinct date of service or unique claim identifier and resubmit." },
  { reason: "Timely filing exceeded (CO-29)", fix: "Administrative appeal only", action: "Document the original submission date with proof (clearinghouse confirmation, portal timestamp) — no clinical argument applies here." },
  { reason: "Member not eligible on date of service (CO-27)", fix: "Administrative fix", action: "Verify eligibility first — this isn't a clinical appeal." },
  { reason: "Not a true emergency, retro denied (PR-40)", fix: "Retrospective authorization appeal", action: "Attach ER records and build a timeline showing PA was genuinely impossible beforehand — administrative-error retros rarely succeed." },
  { reason: "Urgent case processed on standard timeline", fix: "Request for expedited review", action: "Add a specific urgency certification with a clinical timeline for harm." },
  { reason: "Concurrent care limit reached (CO-198)", fix: "Request for extension", action: "Document progress with objective measures, an updated plan, and a defined endpoint." },
  { reason: "No prior authorization obtained, CO-197 (emergency)", fix: "Retrospective authorization request", action: "Emergency documentation is essential — verify the payer's filing window before submitting." },
];

// Portal/UM-vendor/decision-timeline columns are informational context for
// staff, not something Asaanbil auto-routes to yet — always confirm the
// reviewing entity from the actual denial letterhead before filing.
export const DEADLINE_REFERENCE: {
  payer: string;
  imagingReviewer: string;
  standard: string;
  expedited: string;
  peerToPeer: string;
  externalReview: string;
}[] = [
  {
    payer: "Aetna",
    imagingReviewer: "eviCore (commercial imaging)",
    standard: "180 days (commercial) / 60 days (Medicare Adv.)",
    expedited: "72 hrs",
    peerToPeer: "Yes",
    externalReview: "After internal review is exhausted",
  },
  {
    payer: "Cigna",
    imagingReviewer: "eviCore (all imaging)",
    standard: "180 days (all plan types)",
    expedited: "72 hrs",
    peerToPeer: "Yes",
    externalReview: "After internal review is exhausted",
  },
  {
    payer: "UnitedHealthcare",
    imagingReviewer: "UHC internal (InterQual) — Oxford plans route to eviCore",
    standard: "65 days — every plan type, commercial and Medicare Advantage alike",
    expedited: "72 hrs",
    peerToPeer: "Yes",
    externalReview: "Independent review, then further appeal if still denied",
  },
  {
    payer: "Humana",
    imagingReviewer: "MCG / InterQual + eviCore",
    standard: "60-65 days (Medicare Adv.) / 180 days (commercial)",
    expedited: "72 hrs",
    peerToPeer: "Yes",
    externalReview: "Independent review if Medicare Advantage",
  },
  {
    payer: "Anthem / Elevance (BCBS)",
    imagingReviewer: "Carelon (imaging/MSK/cardiology); eviCore (specialty)",
    standard: "60 days (both the PDR billing-dispute track and the Clinical UM medical-necessity track)",
    expedited: "72 hrs",
    peerToPeer: "Yes",
    externalReview: "State-specific process",
  },
  {
    payer: "Molina Healthcare",
    imagingReviewer: "Internal UM",
    standard: "60 days (Medicare Adv.) / state-specific Medicaid (95 days TX to 365 days OH)",
    expedited: "72 hrs",
    peerToPeer: "Yes",
    externalReview: "State Fair Hearing (Medicaid) or QIC → ALJ (Medicare Advantage)",
  },
  {
    payer: "Medicare (Traditional / FFS)",
    imagingReviewer: "CMS MACs (NCD/LCD) — MAC varies by state",
    standard: "120 days (Level 1 MAC redetermination) — 5-level appeal ladder beyond that",
    expedited: "72 hrs",
    peerToPeer: "No — use the 5-level appeal ladder (QIC → ALJ → Medicare Appeals Council → Federal Court) instead",
    externalReview: "Level 2 QIC, then Level 3 ALJ, Level 4 Medicare Appeals Council, Level 5 Federal District Court",
  },
  {
    payer: "Medicaid MCO (general, non-Molina)",
    imagingReviewer: "Varies by plan",
    standard: "Varies by state — typically 60-180 days",
    expedited: "72 hrs",
    peerToPeer: "Yes",
    externalReview: "State fair hearing",
  },
];

export const SOURCE_NOTES: string[] = [
  "Kaiser Family Foundation's analysis of Medicare Advantage prior-authorization data — millions of determinations reviewed, with a large majority of appealed denials ultimately overturned.",
  "CMS's Interoperability and Prior Authorization Final Rule (CMS-0057-F, effective January 2024) — the source of the 7-day standard / 72-hour expedited decision timelines referenced throughout, plus requirements for specific denial reasons and electronic submission.",
  "American Medical Association's prior-authorization physician survey — self-reported data on peer-to-peer review outcomes.",
  "Independent third-party analysis of a large sample of UnitedHealthcare appeals — found meaningfully higher overturn rates when appeals cited specific payer coverage-determination criteria point-by-point versus arguing in general terms.",
  "American Hospital Association reporting on payer denial patterns — national spend on denied-claim appeals and overall overturn rates.",
  "American College of Radiology Appropriateness Criteria — the accepted external standard cited when a payer has no dedicated policy for a given imaging request.",
];

export const SOURCE_HONESTY_NOTE =
  "Some payer-specific overturn-rate figures above come from independent third-party analyses rather than payers' own public reporting — treat those as directionally accurate rather than exact. Timelines and federal rule citations are drawn from CMS's own published rule.";
