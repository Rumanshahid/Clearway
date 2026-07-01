import { Resend } from "resend";

let client: Resend | null = null;

function getClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const resend = getClient();
  if (!resend) {
    console.log(`[email skipped — RESEND_API_KEY not set] to=${to} subject="${subject}"`);
    return;
  }

  const from = process.env.RESEND_FROM_EMAIL || "Clearway <notifications@clearway.health>";
  await resend.emails.send({ from, to, subject, html });
}
