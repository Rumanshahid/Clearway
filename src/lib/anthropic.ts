import Anthropic from "@anthropic-ai/sdk";
import { EXCLUDED_PAYERS_NOTE, LETTER_COMPONENTS, PayerKey, ProcedureCriteria } from "@/lib/criteria";
import { determineLetterApproach, checkSoftWarnings } from "@/lib/letter-logic";
import type { LetterMeta } from "@/lib/database.types";

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
  orderingPhysicianName: string;
  orderingPhysicianCredentials?: string;
  intendedUse?: string;
  redFlags: string[];
  caseFields: Record<string, string>;
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
export function renderSystemPrompt(template: string, procedure: ProcedureCriteria, approachInstruction: string): string {
  const vars: Record<string, string> = {
    procedure_label: procedure.label,
    aetna: procedure.aetna,
    evicore: procedure.evicore,
    sources: procedure.sources,
    red_flags_list: procedure.redFlags.map((f) => `- ${f}`).join("\n") || "- None documented for this procedure.",
    prompt_notes: procedure.promptNotes,
    excluded_payers_note: EXCLUDED_PAYERS_NOTE,
    letter_components_list: LETTER_COMPONENTS.map((c, i) => `${i + 1}. ${c}`).join("\n"),
    approach_instruction: approachInstruction,
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

function parseLetterJson(raw: string): { letterTitle: string; sections: Record<LetterSectionKey, LetterSection>; meta: LetterMeta } {
  let text = raw.trim();
  try {
    return JSON.parse(text);
  } catch {
    const cleaned = text.replace(/```json|```/g, "").trim();
    text = cleaned;
  }
  return JSON.parse(text);
}

export async function generateLetter(input: LetterCaseInput): Promise<LetterOutput> {
  const { approach, instruction } = determineLetterApproach(input.redFlags, input.caseFields);
  const system = renderSystemPrompt(input.promptTemplate, input.procedure, instruction);
  const computedWarnings = checkSoftWarnings(input.procedure, input.payer, input.caseFields);

  const userMessage = `Draft the prior-authorization letter for this case.

Patient reference (de-identified): ${input.patientReference}
Member ID: ${input.memberId || "(not provided)"}
Payer: ${input.payer}
ICD-10 code(s): ${input.icd10Codes.join(", ") || "(none provided)"}
CPT/HCPCS code: ${input.cptCode || "(not provided)"}
Ordering physician: ${input.orderingPhysicianName}${
    input.orderingPhysicianCredentials ? `, ${input.orderingPhysicianCredentials}` : ""
  }
Intended use of imaging result: ${input.intendedUse || "(not specified)"}
Red flags checked by staff: ${input.redFlags.length ? input.redFlags.join("; ") : "None reported"}
Approach: ${approach}

Case details:
${formatCaseFields(input.caseFields)}

Return the JSON object now, exactly as specified in your system instructions.`;

  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

  const response = await getClient().messages.create({
    model,
    max_tokens: 1800,
    system,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content");
  }

  const parsed = parseLetterJson(textBlock.text);

  const mergedWarnings = Array.from(new Set([...(parsed.meta.softWarnings || []), ...computedWarnings]));

  const meta: LetterMeta = {
    ...parsed.meta,
    approachUsed: parsed.meta.approachUsed || approach,
    softWarnings: mergedWarnings,
  };

  return {
    letterTitle: parsed.letterTitle,
    sections: parsed.sections,
    meta,
    plainText: sectionsToPlainText(parsed.letterTitle, parsed.sections),
  };
}
