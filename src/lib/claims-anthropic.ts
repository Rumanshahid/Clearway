import Anthropic from "@anthropic-ai/sdk";
import { getDenialRouting, DENIAL_ROUTING } from "@/lib/claims";
import type { ClaimLetterMeta } from "@/lib/database.types";

let client: Anthropic | null = null;

function getClient() {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export const CLAIM_LETTER_SECTION_KEYS = [
  "c1_claimidentification",
  "c2_serviceanddiagnosis",
  "c3_denialaddressed",
  "c4_policycitation",
  "c5_newevidence",
  "c6_supportingdocs",
  "c7_requestedaction",
  "c8_signature",
] as const;

export type ClaimLetterSectionKey = (typeof CLAIM_LETTER_SECTION_KEYS)[number];

export interface ClaimLetterSection {
  label: string;
  content: string;
}

export interface ClaimLetterOutput {
  letterTitle: string;
  sections: Record<ClaimLetterSectionKey, ClaimLetterSection>;
  meta: ClaimLetterMeta;
  plainText: string;
}

export interface ClaimAppealInput {
  denialReasonCode: string;
  denialReasonDescription?: string;
  payer?: string;
  claimNumber?: string;
  payerClaimReference?: string;
  dateOfService?: string;
  cptCode?: string;
  icd10Code?: string;
  amountBilled?: number;
  amountDenied?: number;
  patientReference?: string;
  patientFullName?: string;
  patientDob?: string;
  memberId?: string;
  groupNumber?: string;
  paObtained?: string;
  newClinicalEvidence?: string;
  supportingDocumentation?: string;
  p2pRequested?: boolean;
  filingMethod?: string;
  orderingPhysicianName?: string;
  orderingPhysicianCredentials?: string;
  orderingPhysicianNpi?: string;
  orderingPhysicianDirectPhone?: string;
}

function sectionsToPlainText(letterTitle: string, sections: Record<ClaimLetterSectionKey, ClaimLetterSection>): string {
  const body = CLAIM_LETTER_SECTION_KEYS.map((key) => `${sections[key].label}\n${sections[key].content}`).join("\n\n");
  return `${letterTitle}\n\n${body}`;
}

function parseLetterJson(raw: string): { letterTitle?: string; sections?: Partial<Record<ClaimLetterSectionKey, ClaimLetterSection>>; meta?: Partial<ClaimLetterMeta> } {
  let text = raw.trim();
  try {
    return JSON.parse(text);
  } catch {
    text = text.replace(/```json|```/g, "").trim();
  }
  return JSON.parse(text);
}

function assertCompleteSections(
  sections: Partial<Record<ClaimLetterSectionKey, ClaimLetterSection>> | undefined
): asserts sections is Record<ClaimLetterSectionKey, ClaimLetterSection> {
  if (!sections) throw new Error("Claude's response was missing the letter sections entirely. Try again.");
  const missing = CLAIM_LETTER_SECTION_KEYS.filter((key) => !sections[key]?.content?.trim());
  if (missing.length > 0) {
    throw new Error(`Claude's response was missing content for: ${missing.join(", ")}. Try again.`);
  }
}

export async function generateClaimAppealLetter(input: ClaimAppealInput): Promise<ClaimLetterOutput> {
  const routing = getDenialRouting(input.denialReasonCode);

  const system = `You are asaanbil.com's claims-denial appeal letter drafting assistant for US medical practices.

You draft appeal letters for insurance claim denials so clinic staff can review, edit, and submit them to the payer. This is a claims appeal, not a prior-authorization letter — reference the claim number and Explanation of Benefits (EOB), never a PA reference number, as the subject of this letter.

DENIAL REASON: ${routing.reason} (code: ${input.denialReasonCode})
LETTER TYPE TO DRAFT: ${routing.letterType}

Drafting guidance for this denial type: ${routing.instruction}

${routing.isAdminIssue
    ? "This is an administrative correction, not a clinical dispute — keep the letter short and factual. Do not manufacture a clinical argument for an administrative problem."
    : "Cite exactly one payer policy source or piece of literature named in the case details, stated with confidence. Never copy payer bulletin language verbatim — paraphrase and map findings to the criterion in your own words."}

VOICE RULES — apply regardless of letter type:
- Mix past and present tense naturally, the way a person actually writes.
- Name specific numbers everywhere a vague word would otherwise appear — exact dates, amounts, and findings, not vague summaries.
- One factual argument per sentence.
- Avoid passive voice — use direct attribution ("in my clinical judgment" or "our billing records show").
- Close with a specific, direct ask naming the exact claim number and requested outcome.

Return your entire response as a single JSON object — no markdown code fences, no commentary before or after it:

{
  "letterTitle": "CLAIMS APPEAL — [LETTER TYPE]",
  "sections": {
    "c1_claimidentification": { "label": "1. Claim & Patient Identification", "content": "..." },
    "c2_serviceanddiagnosis": { "label": "2. Original Service & Diagnosis", "content": "..." },
    "c3_denialaddressed": { "label": "3. Denial Reason Addressed", "content": "..." },
    "c4_policycitation": { "label": "4. Payer Policy / Clinical Citation", "content": "..." },
    "c5_newevidence": { "label": "5. New Evidence & Argument", "content": "..." },
    "c6_supportingdocs": { "label": "6. Supporting Documentation Referenced", "content": "..." },
    "c7_requestedaction": { "label": "7. Requested Action & Deadline", "content": "..." },
    "c8_signature": { "label": "8. Physician/Practice Signature", "content": "..." }
  },
  "meta": {
    "letterType": "${routing.letterType}",
    "isAdminIssue": ${routing.isAdminIssue},
    "softWarnings": ["..."],
    "overturnLikelihood": "LOW" | "MEDIUM" | "HIGH",
    "overturnReason": "one sentence"
  }
}

RULES:
- Component 1 must include the patient's name (or internal reference if no name given), claim number, and payer claim reference if provided.
- Component 2 states the date of service, CPT code, and ICD-10 diagnosis.
- Component 3 must state the exact denial reason and directly rebut or address it.
- Component 6 lists the supporting documentation being attached, if any was provided in the case details — otherwise state plainly that none was specified.
- Component 7 must name the claim number, the specific outcome requested, and the appeal deadline if provided.
- If a required input looks missing or vague, note it plainly as one of meta.softWarnings rather than inventing details.
- overturnLikelihood should reflect how well the documented case addresses the specific denial reason: LOW if new evidence or documentation clearly resolves it, MEDIUM if partially documented, HIGH risk of continued denial if a key requirement is still missing.
- Output nothing except the JSON object.`;

  const userMessage = `Draft the claims appeal letter for this denial.

Patient: ${input.patientFullName || input.patientReference || "(not provided)"}
Patient DOB: ${input.patientDob || "(not provided)"}
Member ID: ${input.memberId || "(not provided)"}
Group number: ${input.groupNumber || "(not provided)"}
Payer: ${input.payer || "(not specified)"}
Claim number: ${input.claimNumber || "(not provided)"}
Payer claim reference: ${input.payerClaimReference || "(not provided)"}
Date of service: ${input.dateOfService || "(not provided)"}
CPT code: ${input.cptCode || "(not provided)"}
ICD-10 code: ${input.icd10Code || "(not provided)"}
Amount billed: ${input.amountBilled != null ? `$${input.amountBilled}` : "(not provided)"}
Amount denied: ${input.amountDenied != null ? `$${input.amountDenied}` : "(not provided)"}
Was a prior authorization obtained: ${input.paObtained || "(not specified)"}
Denial reason description (from EOB): ${input.denialReasonDescription || "(not provided)"}
New clinical evidence not in the original claim: ${input.newClinicalEvidence || "(none provided)"}
Supporting documentation being attached: ${input.supportingDocumentation || "(none specified)"}
Peer-to-peer review requested simultaneously: ${input.p2pRequested ? "Yes" : "No"}
Filing method: ${input.filingMethod || "(not specified)"}
Ordering/treating physician: ${input.orderingPhysicianName || "(not provided)"}${
    input.orderingPhysicianCredentials ? `, ${input.orderingPhysicianCredentials}` : ""
  }
Physician NPI: ${input.orderingPhysicianNpi || "(not provided)"}
Physician direct phone: ${input.orderingPhysicianDirectPhone || "(not provided)"}

Return the JSON object now, exactly as specified in your system instructions.`;

  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

  const response = await getClient().messages.create({
    model,
    max_tokens: 4000,
    system,
    messages: [{ role: "user", content: userMessage }],
  });

  if (response.stop_reason === "max_tokens") {
    throw new Error("The letter response was cut off before it finished (hit the token limit). Try again.");
  }

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content");
  }

  const parsed = parseLetterJson(textBlock.text);
  assertCompleteSections(parsed.sections);

  const letterTitle = parsed.letterTitle?.trim() || `CLAIMS APPEAL — ${routing.letterType.toUpperCase()}`;

  const meta: ClaimLetterMeta = {
    letterType: parsed.meta?.letterType || routing.letterType,
    isAdminIssue: parsed.meta?.isAdminIssue ?? routing.isAdminIssue,
    softWarnings: parsed.meta?.softWarnings || [],
    overturnLikelihood: parsed.meta?.overturnLikelihood || "MEDIUM",
    overturnReason:
      parsed.meta?.overturnReason ||
      "Overturn likelihood wasn't provided in this draft — review the letter against the denial reason yourself before submitting.",
  };

  return {
    letterTitle,
    sections: parsed.sections,
    meta,
    plainText: sectionsToPlainText(letterTitle, parsed.sections),
  };
}

export interface EobExtraction {
  claimNumber?: string;
  denialDate?: string;
  denialReasonCode?: string;
  denialReasonDescription?: string;
  amountBilled?: number;
  amountDenied?: number;
  payerClaimReference?: string;
  memberId?: string;
}

// Lightweight, separate from the letter-drafting call above — this only
// reads a document and reports back structured facts, no drafting rules.
export async function extractEobFields(eobText: string): Promise<EobExtraction> {
  const codeList = DENIAL_ROUTING.map((d) => `${d.code} (${d.reason})`).join(", ");

  const system = `You extract structured claim-denial data from the text of an Explanation of Benefits (EOB) document for a US medical practice's claims-appeal software.

Read the EOB text and return a single JSON object — no markdown fences, no commentary:

{
  "claimNumber": "string or null",
  "denialDate": "YYYY-MM-DD or null",
  "denialReasonCode": "one of [${DENIAL_ROUTING.map((d) => d.code).join(", ")}] that best matches the denial reason, or null if none clearly match",
  "denialReasonDescription": "the denial reason as stated on the EOB, in your own words, or null",
  "amountBilled": number or null,
  "amountDenied": number or null,
  "payerClaimReference": "string or null",
  "memberId": "string or null"
}

Known denial reason codes and what they mean: ${codeList}

Only extract facts actually present in the text — use null for anything not stated. Do not guess or invent values. Output nothing except the JSON object.`;

  const response = await getClient().messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
    max_tokens: 1000,
    system,
    messages: [{ role: "user", content: `EOB text:\n\n${eobText.slice(0, 15000)}` }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content");
  }

  let raw = textBlock.text.trim();
  raw = raw.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(raw) as EobExtraction;

  return {
    claimNumber: parsed.claimNumber || undefined,
    denialDate: parsed.denialDate || undefined,
    denialReasonCode: parsed.denialReasonCode || undefined,
    denialReasonDescription: parsed.denialReasonDescription || undefined,
    amountBilled: typeof parsed.amountBilled === "number" ? parsed.amountBilled : undefined,
    amountDenied: typeof parsed.amountDenied === "number" ? parsed.amountDenied : undefined,
    payerClaimReference: parsed.payerClaimReference || undefined,
    memberId: parsed.memberId || undefined,
  };
}
