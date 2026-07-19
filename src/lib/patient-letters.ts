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

// Shared voice instruction for both letter types -- always patient-authored,
// never the doctor-voice option staff have. Deliberately a lighter, shorter
// structure than lib/letter-logic.ts's buildAuthoringModeInstruction (which
// drives the staff PA letter's 8-section clinical format): patients here
// only ever provide a procedure description/notes or a denial reason/notes,
// not clinical case fields, payer criteria, or ICD-10/CPT codes, so a
// shorter, plainer letter is the honest match for the input available.
const VOICE_INSTRUCTION = `Write entirely in the patient's own first-person voice ("I am asking...", "I have had..."). Use plain English -- no clinical jargon, Latin terms, or drug names the patient wouldn't naturally use. Reference the named doctor as the patient's treating physician, not as a co-author. Keep it to a few short paragraphs, not a formal multi-section clinical document.`;

async function draft(systemPrompt: string, userMessage: string): Promise<string> {
  const anthropic = getClient();
  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
    max_tokens: 1200,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("No text content returned from Anthropic");
  return block.text.trim();
}

export interface PatientPaLetterInput {
  patientFullName: string;
  patientDob: string;
  patientRefId: string;
  doctorName: string;
  procedureDescription: string;
  notes?: string | null;
}

export async function generatePatientPaLetter(input: PatientPaLetterInput): Promise<string> {
  const systemPrompt = `You are drafting a prior-authorization request letter on behalf of a patient, to send to their health insurance plan. ${VOICE_INSTRUCTION}
Cover, in this order: who the patient is (name, DOB, reference ${input.patientRefId}), what procedure/treatment they're asking to have covered, why they need it (based on what they've described), and a closing line naming their doctor, Dr. ${input.doctorName}, as the physician who can be contacted to confirm medical necessity.`;

  const userMessage = `Patient: ${input.patientFullName}, DOB ${input.patientDob}.
Procedure/treatment requested: ${input.procedureDescription}
${input.notes ? `Additional notes from the patient: ${input.notes}` : ""}
Treating doctor: Dr. ${input.doctorName}`;

  return draft(systemPrompt, userMessage);
}

export interface PatientAppealLetterInput {
  patientFullName: string;
  patientDob: string;
  patientRefId: string;
  doctorName: string;
  claimNumber?: string | null;
  dateOfService?: string | null;
  denialReason: string;
  notes?: string | null;
}

export async function generatePatientAppealLetter(input: PatientAppealLetterInput): Promise<string> {
  const systemPrompt = `You are drafting a claim appeal letter on behalf of a patient, to send to their health insurance plan. ${VOICE_INSTRUCTION}
Cover, in this order: who the patient is (name, DOB, reference ${input.patientRefId}, claim number if given), what the plan denied and why (as the patient understands it), why the patient believes the denial was wrong, and a closing line naming their doctor, Dr. ${input.doctorName}, as the physician who can be contacted to support the appeal.`;

  const userMessage = `Patient: ${input.patientFullName}, DOB ${input.patientDob}.
${input.claimNumber ? `Claim number: ${input.claimNumber}` : ""}
${input.dateOfService ? `Date of service: ${input.dateOfService}` : ""}
Reason the claim was denied: ${input.denialReason}
${input.notes ? `Additional notes from the patient: ${input.notes}` : ""}
Treating doctor: Dr. ${input.doctorName}`;

  return draft(systemPrompt, userMessage);
}
