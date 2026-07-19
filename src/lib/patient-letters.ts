import Anthropic from "@anthropic-ai/sdk";
import type { PatientLetterRiskFlag } from "@/lib/database.types";

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
const VOICE_INSTRUCTION = `Write entirely in the patient's own first-person voice ("I am asking...", "I have had..."). Use plain English -- no clinical jargon, Latin terms, or drug names the patient wouldn't naturally use. Reference the named doctor as the patient's treating physician, not as a co-author. Keep it to a few short paragraphs, not a formal multi-section clinical document. Do not write a date, address block, salutation ("Dear..." / "To Whom It May Concern"), or signature -- write ONLY the body paragraphs. Those are added separately in a fixed format so the letter's factual header is never left to guesswork.`;

const JSON_OUTPUT_INSTRUCTION = `Return your entire response as a single JSON object -- no markdown code fences, no commentary before or after it:

{
  "body": "the letter body paragraphs only, as plain text with blank lines between paragraphs",
  "riskFlags": [{ "severity": "high" | "medium" | "low", "message": "..." }],
  "suggestions": ["...", "..."]
}

riskFlags: identify anything in what the patient provided that could realistically weaken this request or cause the insurer to ask for more before deciding -- e.g. no specific diagnosis or symptom timeline, no documented prior treatments tried and their outcome, vague urgency, missing insurance/member ID, no way for the insurer to reach the physician's office directly. Rate severity by how likely that specific gap is to cause a delay or denial. Return an empty array only if the case is genuinely well documented for a patient-submitted request.
suggestions: concrete next steps the patient can take before sending this -- e.g. "Ask Dr. X's office to fax your chart notes citing this request", "Add your insurance member ID and group number from your card", "Note the exact dates you tried physical therapy". Keep each to one sentence. Return an empty array only if there is genuinely nothing to add.
Output nothing except the JSON object.`;

interface StructuredLetterResult {
  body: string;
  riskFlags: PatientLetterRiskFlag[];
  suggestions: string[];
}

function parseStructuredJson(raw: string): StructuredLetterResult {
  let text = raw.trim();
  text = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(text) as Partial<StructuredLetterResult>;
  if (!parsed.body?.trim()) throw new Error("Claude's response was missing the letter body. Try again.");
  return {
    body: parsed.body.trim(),
    riskFlags: Array.isArray(parsed.riskFlags) ? parsed.riskFlags : [],
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
  };
}

async function draftStructured(systemPrompt: string, userMessage: string): Promise<StructuredLetterResult> {
  const anthropic = getClient();
  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
    max_tokens: 1600,
    system: `${systemPrompt}\n\n${JSON_OUTPUT_INSTRUCTION}`,
    messages: [{ role: "user", content: userMessage }],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("No text content returned from Anthropic");
  return parseStructuredJson(block.text);
}

// Deterministic header/footer -- factual fields (date, member ID, address)
// are assembled here rather than trusted to the model, so a "ready to send"
// letter never has a hallucinated ID number or date in it.
export interface PatientContactInfo {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  phone?: string | null;
  email?: string | null;
  insuranceCompany?: string | null;
  memberId?: string | null;
  groupNumber?: string | null;
  planName?: string | null;
}

function formatToday(): string {
  return new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function buildHeader(patientFullName: string, contact: PatientContactInfo): string {
  const lines: string[] = [formatToday(), "", patientFullName];
  const addressLine = [contact.city, contact.state].filter(Boolean).join(", ") + (contact.zip ? ` ${contact.zip}` : "");
  if (contact.address) lines.push(contact.address);
  if (addressLine.trim()) lines.push(addressLine);
  const contactLine = [contact.phone, contact.email].filter(Boolean).join(" | ");
  if (contactLine) lines.push(contactLine);
  lines.push("");
  if (contact.insuranceCompany) lines.push(contact.insuranceCompany);
  lines.push("");
  return lines.join("\n");
}

function buildIdLine(label: string, patientDob: string, patientRefId: string, contact: PatientContactInfo): string {
  const parts = [`DOB ${patientDob}`, `Reference ${patientRefId}`];
  if (contact.memberId) parts.push(`Member ID ${contact.memberId}`);
  if (contact.groupNumber) parts.push(`Group ${contact.groupNumber}`);
  if (contact.planName) parts.push(`Plan ${contact.planName}`);
  return `Re: ${label} -- ${parts.join(", ")}`;
}

function assembleLetter(opts: {
  patientFullName: string;
  patientDob: string;
  patientRefId: string;
  reLabel: string;
  contact: PatientContactInfo;
  body: string;
}): string {
  const header = buildHeader(opts.patientFullName, opts.contact);
  const idLine = buildIdLine(opts.reLabel, opts.patientDob, opts.patientRefId, opts.contact);
  const salutation = opts.contact.insuranceCompany
    ? `To the ${opts.contact.insuranceCompany} Review Department:`
    : "To Whom It May Concern:";
  return [header, idLine, "", salutation, "", opts.body, "", "Sincerely,", opts.patientFullName].join("\n");
}

export interface PatientPaLetterInput {
  patientFullName: string;
  patientDob: string;
  patientRefId: string;
  doctorName: string;
  procedureDescription: string;
  notes?: string | null;
  contact: PatientContactInfo;
}

export interface PatientLetterOutput {
  letter: string;
  riskFlags: PatientLetterRiskFlag[];
  suggestions: string[];
}

export async function generatePatientPaLetter(input: PatientPaLetterInput): Promise<PatientLetterOutput> {
  const systemPrompt = `You are drafting the body of a prior-authorization request letter on behalf of a patient, to send to their health insurance plan. ${VOICE_INSTRUCTION}
Cover, in this order: what procedure/treatment they're asking to have covered, why they need it (based on what they've described), and a closing line naming their doctor, Dr. ${input.doctorName}, as the physician who can be contacted to confirm medical necessity.`;

  const userMessage = `Patient: ${input.patientFullName}, DOB ${input.patientDob}.
Procedure/treatment requested: ${input.procedureDescription}
${input.notes ? `Additional notes from the patient: ${input.notes}` : "Additional notes from the patient: (none provided)"}
Treating doctor: Dr. ${input.doctorName}
Insurance on file: ${input.contact.insuranceCompany || "(not provided)"}${input.contact.memberId ? `, member ID ${input.contact.memberId}` : ""}`;

  const { body, riskFlags, suggestions } = await draftStructured(systemPrompt, userMessage);
  const letter = assembleLetter({
    patientFullName: input.patientFullName,
    patientDob: input.patientDob,
    patientRefId: input.patientRefId,
    reLabel: "Prior Authorization Request",
    contact: input.contact,
    body,
  });
  return { letter, riskFlags, suggestions };
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
  contact: PatientContactInfo;
}

export async function generatePatientAppealLetter(input: PatientAppealLetterInput): Promise<PatientLetterOutput> {
  const systemPrompt = `You are drafting the body of a claim appeal letter on behalf of a patient, to send to their health insurance plan. ${VOICE_INSTRUCTION}
Cover, in this order: what the plan denied and why (as the patient understands it), why the patient believes the denial was wrong, and a closing line naming their doctor, Dr. ${input.doctorName}, as the physician who can be contacted to support the appeal.`;

  const userMessage = `Patient: ${input.patientFullName}, DOB ${input.patientDob}.
${input.claimNumber ? `Claim number: ${input.claimNumber}` : "Claim number: (not provided)"}
${input.dateOfService ? `Date of service: ${input.dateOfService}` : "Date of service: (not provided)"}
Reason the claim was denied: ${input.denialReason}
${input.notes ? `Additional notes from the patient: ${input.notes}` : "Additional notes from the patient: (none provided)"}
Treating doctor: Dr. ${input.doctorName}
Insurance on file: ${input.contact.insuranceCompany || "(not provided)"}${input.contact.memberId ? `, member ID ${input.contact.memberId}` : ""}`;

  const { body, riskFlags, suggestions } = await draftStructured(systemPrompt, userMessage);
  const letter = assembleLetter({
    patientFullName: input.patientFullName,
    patientDob: input.patientDob,
    patientRefId: input.patientRefId,
    reLabel: input.claimNumber ? `Appeal of Claim ${input.claimNumber}` : "Claim Appeal",
    contact: input.contact,
    body,
  });
  return { letter, riskFlags, suggestions };
}
