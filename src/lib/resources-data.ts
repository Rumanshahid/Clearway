// Paraphrased reference data — denial-code guidance, payer appeal deadlines,
// and source summaries. Rewritten in original wording, not quoted from any
// source. Shown on the Resources page and used to seed the tips rotator.

export const DENIAL_GUIDE: { reason: string; fix: string; action: string }[] = [
  { reason: "Not medically necessary", fix: "Formal appeal", action: "Add new clinical evidence and cite a specialty-society guideline directly." },
  { reason: "Conservative care not documented", fix: "Formal appeal", action: "Document the specific treatments tried, exact doses, durations, and outcomes." },
  { reason: "Step therapy required", fix: "Step-therapy exception request", action: "Prove the required step drug(s) were tried and failed, or are contraindicated — records from a prior insurer still count." },
  { reason: "Missing documentation", fix: "Formal appeal", action: "Attach the missing record and briefly explain why it wasn't included originally." },
  { reason: "Experimental / investigational", fix: "Formal appeal", action: "Cite peer-reviewed literature, an FDA approval, or a specialty-society guideline." },
  { reason: "Wrong CPT code", fix: "Resubmission", action: "Correct the code and resubmit — this isn't a clinical appeal." },
  { reason: "Member not eligible", fix: "Administrative fix", action: "Verify eligibility first — this isn't a clinical appeal." },
  { reason: "Urgent case processed on standard timeline", fix: "Request for expedited review", action: "Add a specific urgency certification with a clinical timeline for harm." },
  { reason: "Concurrent care limit reached", fix: "Request for extension", action: "Document progress with objective measures, an updated plan, and a defined endpoint." },
  { reason: "No prior authorization obtained (emergency)", fix: "Retrospective authorization request", action: "Emergency documentation is essential — verify the payer's filing window before submitting." },
];

export const DEADLINE_REFERENCE: { payer: string; standard: string; expedited: string; peerToPeer: string; externalReview: string }[] = [
  { payer: "Aetna", standard: "180 days", expedited: "72 hrs", peerToPeer: "Yes", externalReview: "After internal review is exhausted" },
  { payer: "UnitedHealthcare", standard: "65 days (commercial) / 60 days (Medicare Adv.)", expedited: "72 hrs", peerToPeer: "Yes", externalReview: "Independent review, then further appeal if still denied" },
  { payer: "Cigna", standard: "180 days", expedited: "72 hrs", peerToPeer: "Yes", externalReview: "After internal review is exhausted" },
  { payer: "BCBS (varies by state)", standard: "180 days for most plans", expedited: "72 hrs", peerToPeer: "Yes", externalReview: "State-specific process" },
  { payer: "Humana", standard: "60 days (Medicare Adv.)", expedited: "72 hrs", peerToPeer: "Yes", externalReview: "Independent review if Medicare Advantage" },
  { payer: "Medicare Advantage (general)", standard: "60 days", expedited: "72 hrs", peerToPeer: "Yes", externalReview: "Independent review, then further appeal" },
  { payer: "Medicaid MCO", standard: "Varies by state", expedited: "72 hrs", peerToPeer: "Yes", externalReview: "State fair hearing" },
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
