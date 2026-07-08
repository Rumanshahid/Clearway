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

export interface IntakeInterpretation {
  isNewPatient: boolean;
  isUrgent: boolean;
  reasonForVisit: string;
}

const SYSTEM_PROMPT = `You are a scheduling assistant for a medical practice, reading a patient's intake answers before their appointment is booked.

Decide:
- Whether this is a new patient visit (first time with this doctor) or a returning patient
- Whether this sounds urgent (severe/worsening symptoms, safety concerns, explicit urgency) -- when genuinely unsure, prefer false rather than over-flagging
- A short (under 15 words), plain-language reason for visit a front-desk staff member would find useful, based only on what the patient actually said

Return ONLY a single JSON object, no markdown fences, no commentary:
{
  "isNewPatient": true or false,
  "isUrgent": true or false,
  "reasonForVisit": "short string"
}`;

function parseRoutingJson(raw: string): Partial<IntakeInterpretation> {
  let text = raw.trim();
  try {
    return JSON.parse(text);
  } catch {
    text = text.replace(/```json|```/g, "").trim();
  }
  return JSON.parse(text);
}

export async function interpretIntake(answers: Record<string, string>): Promise<IntakeInterpretation> {
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

  const userMessage = `Patient's intake answers:
${Object.entries(answers)
  .map(([question, answer]) => `- ${question}: ${answer}`)
  .join("\n")}

Return the JSON object now.`;

  const response = await getClient().messages.create({
    model,
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  if (response.stop_reason === "max_tokens") {
    throw new Error("The routing response was cut off before it finished. Try again.");
  }

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content");
  }

  const parsed = parseRoutingJson(textBlock.text);

  return {
    isNewPatient: parsed.isNewPatient ?? false,
    isUrgent: parsed.isUrgent ?? false,
    reasonForVisit: parsed.reasonForVisit?.trim() || "Not specified",
  };
}

const THANK_YOU_SYSTEM_PROMPT = `You write short, warm post-visit thank-you emails on behalf of a doctor's office, addressed to the patient by first name.

Rules:
- 3-5 sentences, plain text (no markdown, no headers)
- Written as if from the doctor's office staff, warm but professional, never clinical or robotic
- Never invent medical advice, next steps, or claims about the visit beyond what's given
- Do not mention billing, cost, or insurance
- Sign off simply, e.g. "— [Doctor Name]'s office"

Return ONLY the email body text, nothing else -- no subject line, no JSON, no commentary.`;

export async function draftThankYouEmail(params: {
  patientFirstName: string;
  doctorName: string;
  appointmentTypeName: string;
  reasonForVisit: string;
}): Promise<string> {
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

  const userMessage = `Patient first name: ${params.patientFirstName}
Doctor: ${params.doctorName}
Visit type: ${params.appointmentTypeName}
Reason for visit (as given at booking, may be brief): ${params.reasonForVisit}

Write the thank-you email body now.`;

  const response = await getClient().messages.create({
    model,
    max_tokens: 400,
    system: THANK_YOU_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  if (response.stop_reason === "max_tokens") {
    throw new Error("The thank-you draft was cut off before it finished. Try again.");
  }

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content");
  }

  return textBlock.text.trim();
}
