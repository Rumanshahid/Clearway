import Anthropic from "@anthropic-ai/sdk";
import { EXCLUDED_PAYERS_NOTE, LETTER_COMPONENTS, PayerKey, ProcedureCriteria } from "@/lib/criteria";

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
  icd10Codes: string[];
  orderingPhysicianName: string;
  orderingPhysicianCredentials?: string;
  intendedUse?: string;
  redFlags: string[];
  caseFields: Record<string, string>;
}

// The admin-editable wrapper prompt (prompt_templates table) is rendered with
// these placeholders. Keep this list in sync with the seed row in
// supabase/migrations/0004_seed_defaults.sql and the admin editor's preview.
export function renderSystemPrompt(template: string, procedure: ProcedureCriteria): string {
  const vars: Record<string, string> = {
    procedure_label: procedure.label,
    aetna: procedure.aetna,
    evicore: procedure.evicore,
    sources: procedure.sources,
    red_flags_list: procedure.redFlags.map((f) => `- ${f}`).join("\n") || "- None documented for this procedure.",
    prompt_notes: procedure.promptNotes,
    excluded_payers_note: EXCLUDED_PAYERS_NOTE,
    letter_components_list: LETTER_COMPONENTS.map((c, i) => `${i + 1}. ${c}`).join("\n"),
  };

  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => vars[key] ?? match);
}

function formatCaseFields(caseFields: Record<string, string>): string {
  return Object.entries(caseFields)
    .filter(([, v]) => v && v.trim().length > 0)
    .map(([k, v]) => `- ${k.replace(/_/g, " ")}: ${v}`)
    .join("\n");
}

export async function generateLetter(input: LetterCaseInput): Promise<string> {
  const system = renderSystemPrompt(input.promptTemplate, input.procedure);

  const userMessage = `Draft the prior-authorization letter for this case.

Patient reference (de-identified): ${input.patientReference}
Payer: ${input.payer}
ICD-10 code(s): ${input.icd10Codes.join(", ") || "(none provided)"}
Ordering physician: ${input.orderingPhysicianName}${
    input.orderingPhysicianCredentials ? `, ${input.orderingPhysicianCredentials}` : ""
  }
Intended use of imaging result: ${input.intendedUse || "(not specified)"}
Red flags checked by staff: ${input.redFlags.length ? input.redFlags.join("; ") : "None reported"}

Case details:
${formatCaseFields(input.caseFields)}`;

  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

  const response = await getClient().messages.create({
    model,
    max_tokens: 2000,
    system,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content");
  }
  return textBlock.text;
}
