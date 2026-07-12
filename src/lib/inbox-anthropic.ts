import Anthropic from "@anthropic-ai/sdk";
import type { InboxCategory } from "@/lib/database.types";

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

export interface ClassifiableMessage {
  id: string;
  from: string;
  subject: string | null;
  snippet: string;
}

export interface InboxClassification {
  category: InboxCategory;
  isRelevant: boolean;
}

const SYSTEM_PROMPT = `You triage a doctor's inbox to surface only what needs their attention on a clinic dashboard.

Classify each email into exactly one category:
- "medical_question": a patient (or someone on their behalf) asking a clinical/medical question directly.
- "patient_inquiry": a patient asking about scheduling, records, billing, prescriptions, or anything else practice-related.
- "faq": a general question likely answerable with a standard practice FAQ (hours, location, insurance accepted, parking, etc.).
- "other": anything not from or about a patient -- marketing, newsletters, vendor/supplier email, internal team email, spam, automated notifications, unrelated business correspondence.

Only "medical_question", "patient_inquiry", and "faq" are relevant to show on the dashboard. When genuinely uncertain between a patient-related category and "other", prefer "other" -- false negatives (a patient email gets buried) are worse to guess wrong on than false positives are costly, but an inbox cluttered with obviously irrelevant mail defeats the point of filtering at all, so don't classify newsletters/marketing/vendor mail as patient-related just because they use words like "health" or "care".

Respond with ONLY a JSON array, one object per input email, in the same order, each shaped exactly like:
{"id": "<the email's id>", "category": "medical_question" | "patient_inquiry" | "faq" | "other"}

No prose, no markdown fences, just the JSON array.`;

export async function classifyInboxMessages(messages: ClassifiableMessage[]): Promise<Map<string, InboxClassification>> {
  const result = new Map<string, InboxClassification>();
  if (messages.length === 0) return result;

  const userContent = messages
    .map((m) => `id: ${m.id}\nfrom: ${m.from}\nsubject: ${m.subject || "(no subject)"}\nsnippet: ${m.snippet}`)
    .join("\n---\n");

  const response = await getClient().messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userContent }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return result;

  let parsed: { id: string; category: InboxCategory }[];
  try {
    // Claude occasionally wraps JSON in a fenced block despite instructions
    // not to -- strip that before parsing rather than failing the whole batch.
    const cleaned = textBlock.text.trim().replace(/^```json\s*/i, "").replace(/```\s*$/, "");
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error("classifyInboxMessages: could not parse Claude response", err, textBlock.text);
    return result;
  }

  for (const item of parsed) {
    if (!item?.id) continue;
    const category: InboxCategory = ["medical_question", "patient_inquiry", "faq", "other"].includes(item.category)
      ? item.category
      : "other";
    result.set(item.id, { category, isRelevant: category !== "other" });
  }
  return result;
}
