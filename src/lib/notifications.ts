import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

// Creates the in-app notification and fires the matching email in one call,
// since every current trigger point wants both. Email failures are logged,
// not thrown — a missing RESEND_API_KEY shouldn't break letter drafting.
export async function notify(params: {
  userId: string;
  email?: string | null;
  type: string;
  message: string;
  link?: string;
  emailSubject?: string;
  emailHtml?: string;
}) {
  const supabase = await createClient();
  await supabase.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    message: params.message,
    link: params.link || null,
  });

  if (params.email && params.emailSubject && params.emailHtml) {
    try {
      await sendEmail({ to: params.email, subject: params.emailSubject, html: params.emailHtml });
    } catch (err) {
      console.error("notify: email send failed", err);
    }
  }
}
