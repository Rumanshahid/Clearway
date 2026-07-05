import Anthropic from "@anthropic-ai/sdk";
import { CITATION_FORMAT_NOTE, EXCLUDED_PAYERS_NOTE, LETTER_COMPONENTS, PayerKey, ProcedureCriteria } from "@/lib/criteria";
import { determineLetterApproach, checkSoftWarnings, buildAuthoringModeInstruction } from "@/lib/letter-logic";
import { isEligibilityStale } from "@/lib/eligibility";
import type { AuthoringMode, LetterMeta } from "@/lib/database.types";

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

export interface LetterCaseInput {
  procedure: ProcedureCriteria;
  promptTemplate: string;
  payer: PayerKey;
  patientReference: string;
  memberId?: string;
  icd10Codes: string[];
  cptCode?: string;
  authoringMode: AuthoringMode;
  orderingPhysicianName: string;
  orderingPhysicianCredentials?: string;
  intendedUse?: string;
  redFlags: string[];
  caseFields: Record<string, string>;
  patientFullName?: string;
  patientDob?: string;
  patientAddress?: string;
  patientCityStateZip?: string;
  patientPhone?: string;
  insuranceGroupNumber?: string;
  orderingPhysicianNpi?: string;
  orderingPhysicianDirectPhone?: string;
  orderingPhysicianSpecialty?: string;
  orderingPhysicianFax?: string;
  planType?: string;
  eligibilityStatus?: string;
  eligibilityCheckedAt?: string;
}

export interface LetterSection {
  label: string;
  content: string;
}

export const LETTER_SECTION_KEYS = [
  "s1_demographics",
  "s2_diagnosis",
  "s3_procedure",
  "s4_policycitation",
  "s5_clinicalrationale",
  "s6_conservativecare",
  "s7_duration",
  "s8_signature",
] as const;

export type LetterSectionKey = (typeof LETTER_SECTION_KEYS)[number];

export interface LetterOutput {
  letterTitle: string;
  sections: Record<LetterSectionKey, LetterSection>;
  meta: LetterMeta;
  plainText: string;
}

// The admin-editable wrapper prompt (prompt_templates table) is rendered with
// these placeholders. Keep this list in sync with the seed/update SQL and the
// admin editor's preview.
export function renderSystemPrompt(
  template: string,
  procedure: ProcedureCriteria,
  approachInstruction: string,
  authoringMode: AuthoringMode
): string {
  const vars: Record<string, string> = {
    procedure_label: procedure.label,
    aetna: procedure.aetna,
    evicore: procedure.evicore,
    sources: procedure.sources,
    red_flags_list: procedure.redFlags.map((f) => `- ${f}`).join("\n") || "- None documented for this procedure.",
    prompt_notes: procedure.promptNotes,
    excluded_payers_note: EXCLUDED_PAYERS_NOTE,
    citation_format_note: CITATION_FORMAT_NOTE,
    letter_components_list: LETTER_COMPONENTS.map((c, i) => `${i + 1}. ${c}`).join("\n"),
    approach_instruction: approachInstruction,
    authoring_mode_instruction: buildAuthoringModeInstruction(authoringMode),
  };

  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => vars[key] ?? match);
}

function formatCaseFields(caseFields: Record<string, string>): string {
  return Object.entries(caseFields)
    .filter(([, v]) => v && v.trim().length > 0)
    .map(([k, v]) => `- ${k.replace(/_/g, " ")}: ${v}`)
    .join("\n");
}

function sectionsToPlainText(letterTitle: string, sections: Record<LetterSectionKey, LetterSection>): string {
  const body = LETTER_SECTION_KEYS.map((key) => `${sections[key].label}\n${sections[key].content}`).join("\n\n");
  return `${letterTitle}\n\n${body}`;
}

function parseLetterJson(raw: string): { letterTitle?: string; sections?: Partial<Record<LetterSectionKey, LetterSection>>; meta?: Partial<LetterMeta> } {
  let text = raw.trim();
  try {
    return JSON.parse(text);
  } catch {
    const cleaned = text.replace(/```json|```/g, "").trim();
    text = cleaned;
  }
  return JSON.parse(text);
}

// Claude usually follows the JSON schema exactly, but "usually" isn't good
// enough for a field that's the entire point of the request — a missing or
// empty section should fail loudly and specifically, not surface as a
// generic crash or a letter with a silent blank spot in it.
function assertCompleteSections(
  sections: Partial<Record<LetterSectionKey, LetterSection>> | undefined
): asserts sections is Record<LetterSectionKey, LetterSection> {
  if (!sections) {
    throw new Error("Claude's response was missing the letter sections entirely. Try again.");
  }
  const missing = LETTER_SECTION_KEYS.filter((key) => !sections[key]?.content?.trim());
  if (missing.length > 0) {
    throw new Error(`Claude's response was missing content for: ${missing.join(", ")}. Try again.`);
  }
}

export async function generateLetter(input: LetterCaseInput): Promise<LetterOutput> {
  const { approach, instruction } = determineLetterApproach(input.redFlags, input.caseFields);
  const system = renderSystemPrompt(input.promptTemplate, input.procedure, instruction, input.authoringMode);
  const computedWarnings = checkSoftWarnings(input.procedure, input.payer, input.caseFields, {
    insuranceGroupNumber: input.insuranceGroupNumber,
    orderingPhysicianSpecialty: input.orderingPhysicianSpecialty,
    orderingPhysicianFax: input.orderingPhysicianFax,
    eligibilityStatus: input.eligibilityStatus,
    eligibilityStale: isEligibilityStale(input.eligibilityCheckedAt),
  });

  const userMessage = `Draft the prior-authorization letter for this case.

Patient full legal name: ${input.patientFullName || "(not provided — use the internal reference below instead)"}
Patient date of birth: ${input.patientDob || "(not provided)"}
Patient address: ${input.patientAddress || "(not provided)"}${
    input.patientCityStateZip ? `, ${input.patientCityStateZip}` : ""
  }
Patient phone: ${input.patientPhone || "(not provided)"}
Internal patient reference (never send to payer, staff-facing only): ${input.patientReference}
Member ID: ${input.memberId || "(not provided)"}
Insurance group number: ${input.insuranceGroupNumber || "(not provided)"}
Payer: ${input.payer}
Plan type: ${input.planType || "(not specified)"}
ICD-10 code(s): ${input.icd10Codes.join(", ") || "(none provided)"}
CPT/HCPCS code: ${input.cptCode || "(not provided)"}
Ordering physician: ${input.orderingPhysicianName}${
    input.orderingPhysicianCredentials ? `, ${input.orderingPhysicianCredentials}` : ""
  }${input.orderingPhysicianSpecialty ? ` (${input.orderingPhysicianSpecialty})` : ""}
Ordering physician NPI: ${input.orderingPhysicianNpi || "(not provided)"}
Ordering physician direct phone: ${input.orderingPhysicianDirectPhone || "(not provided)"}
Ordering physician fax: ${input.orderingPhysicianFax || "(not provided)"}
Intended use of imaging result: ${input.intendedUse || "(not specified)"}
Red flags checked by staff: ${input.redFlags.length ? input.redFlags.join("; ") : "None reported"}
Approach: ${approach}

Case details:
${formatCaseFields(input.caseFields)}

Return the JSON object now, exactly as specified in your system instructions.`;

  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

  // 4500 rather than the earlier 3000: component 1 now has to name patient
  // full name/DOB/address/group number and component 8 the physician's
  // NPI/phone, on top of the existing voice-rules verbosity — the earlier
  // budget started getting hit again once those fields were added. A tight
  // budget risks Claude's JSON response getting cut off mid-object, which
  // fails JSON.parse below and previously crashed the whole page.
  const response = await getClient().messages.create({
    model,
    max_tokens: 4500,
    system,
    messages: [{ role: "user", content: userMessage }],
  });

  if (response.stop_reason === "max_tokens") {
    throw new Error(
      "The letter response was cut off before it finished (hit the token limit). Try again — this is usually transient."
    );
  }

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content");
  }

  const parsed = parseLetterJson(textBlock.text);
  assertCompleteSections(parsed.sections);

  const letterTitle = parsed.letterTitle?.trim() || `PRIOR AUTHORIZATION REQUEST — ${input.procedure.label.toUpperCase()}`;

  const mergedWarnings = Array.from(new Set([...(parsed.meta?.softWarnings || []), ...computedWarnings]));

  const meta: LetterMeta = {
    approachUsed: parsed.meta?.approachUsed || approach,
    redFlagsIdentified: parsed.meta?.redFlagsIdentified || input.redFlags,
    softWarnings: mergedWarnings,
    denialRiskAssessment: parsed.meta?.denialRiskAssessment || "MEDIUM",
    denialRiskReason: parsed.meta?.denialRiskReason || "Risk assessment wasn't provided in this draft — review the letter against the payer criteria yourself before submitting.",
  };

  return {
    letterTitle,
    sections: parsed.sections,
    meta,
    plainText: sectionsToPlainText(letterTitle, parsed.sections),
  };
}
