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

// Deliberately separate from lib/anthropic.ts's generateLetter() -- that
// pipeline drafts in a *doctor's* clinical voice, citing specific payer
// medical-necessity criteria a patient has no way to know or judge. This
// writes a first-person, patient-voice request instead: what the patient
// is asking for and why, in their own words, for the practice's staff to
// review and turn into a properly-cited letter. Never blocks submission --
// a generation failure just means no draft is attached yet.
export async function generatePatientLetter(params: {
  kind: "prior_authorization" | "claim_appeal";
  patientName: string;
  dob: string;
  insuranceCompany?: string | null;
  memberId?: string | null;
  description: string;
  notes?: string | null;
  claimNumber?: string | null;
  dateOfService?: string | null;
}): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const isAppeal = params.kind === "claim_appeal";
  const system = isAppeal
    ? "You write short, clear, first-person letters FROM A PATIENT appealing a denied insurance claim -- not a clinical/legal letter, just a genuine, respectful patient's own account of why the claim should be reconsidered. Plain language, no medical-necessity citations or clinical jargon (the patient isn't a doctor). End by asking the practice's staff to review and help finalize the appeal. Return ONLY the letter text, no preamble."
    : "You write short, clear, first-person letters FROM A PATIENT requesting help getting prior authorization for care -- not a clinical/legal letter, just a genuine, respectful patient's own account of what they need and why it matters to them. Plain language, no medical-necessity citations or clinical jargon (the patient isn't a doctor). End by asking the practice's staff to review and help finalize the official request. Return ONLY the letter text, no preamble."

  const details = [
    `Patient: ${params.patientName} (DOB ${params.dob})`,
    params.insuranceCompany ? `Insurance: ${params.insuranceCompany}` : null,
    params.memberId ? `Member ID: ${params.memberId}` : null,
    isAppeal && params.claimNumber ? `Claim number: ${params.claimNumber}` : null,
    isAppeal && params.dateOfService ? `Date of service: ${params.dateOfService}` : null,
    isAppeal ? `Reason given for denial: ${params.description}` : `What they need: ${params.description}`,
    params.notes ? `Additional notes from patient: ${params.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await getClient().messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
      max_tokens: 700,
      system,
      messages: [{ role: "user", content: `Draft the letter now, in first person as the patient.\n\n${details}` }],
    });

    const block = response.content.find((b) => b.type === "text");
    return block && block.type === "text" ? block.text.trim() : null;
  } catch (err) {
    console.error("generatePatientLetter failed", err);
    return null;
  }
}
