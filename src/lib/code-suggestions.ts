import Anthropic from "@anthropic-ai/sdk";

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

export interface CodeSuggestion {
  code: string;
  label: string;
}

export interface CodeSuggestionResult {
  icd10: CodeSuggestion[];
  cpt: CodeSuggestion[];
  caveat: string;
}

// Suggestions only, never auto-applied -- staff click one to add it to the
// ICD-10/CPT fields, same as every other AI output in this app (letters,
// EOB extraction) being reviewable rather than authoritative. No new paid
// service involved: this rides on the same Anthropic API usage the letter
// drafting already pays for.
export async function suggestCodes(input: {
  procedureLabel: string;
  caseFields: Record<string, string>;
  intendedUse?: string;
}): Promise<CodeSuggestionResult> {
  const caseDetails = Object.entries(input.caseFields)
    .filter(([, value]) => value.trim())
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  const system = `You help US medical practice staff fill in a prior-authorization request by suggesting likely ICD-10 diagnosis codes and the CPT/HCPCS procedure code for the case described.

These are suggestions for a coder or clinician to verify against the patient's actual chart before submitting -- never invent a code you're not reasonably confident about, and never present these as final/authoritative.

Return a single JSON object, no markdown fences, no commentary:

{
  "icd10": [{ "code": "M54.5", "label": "Low back pain" }],
  "cpt": [{ "code": "72148", "label": "MRI lumbar spine without contrast" }],
  "caveat": "one short sentence reminding staff to verify these against the chart"
}

Suggest at most 3 ICD-10 codes (most likely first) and at most 2 CPT/HCPCS codes. If the case details are too thin to suggest anything responsibly, return empty arrays rather than guessing.`;

  const userMessage = `Procedure: ${input.procedureLabel}
${input.intendedUse ? `Intended use: ${input.intendedUse}\n` : ""}Case details:
${caseDetails || "(none entered yet)"}`;

  const response = await getClient().messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
    max_tokens: 600,
    system,
    messages: [{ role: "user", content: userMessage }],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("No text content returned from Anthropic");

  const raw = block.text.trim().replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(raw) as Partial<CodeSuggestionResult>;

  return {
    icd10: Array.isArray(parsed.icd10) ? parsed.icd10.slice(0, 3) : [],
    cpt: Array.isArray(parsed.cpt) ? parsed.cpt.slice(0, 2) : [],
    caveat: parsed.caveat || "Verify these against the patient's chart before submitting.",
  };
}
