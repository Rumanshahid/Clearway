import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { appointmentReminderEmail, reviewRequestEmail } from "@/lib/scheduling-emails";

export const runtime = "nodejs";

// Runs every 15 minutes (see vercel.json) rather than once/day like the
// other cron jobs, since a "2 hours before" reminder needs finer granularity
// than a daily check can give. Each appointment carries its own
// reminder_24h_sent_at / reminder_2h_sent_at columns so a "not yet sent and
// within the window" query is correct regardless of exact cron timing --
// no dependency on hitting an exact threshold on a particular run.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await createAdminClient();
  const now = new Date();

  const { data: prefsRows } = await admin.from("notification_prefs").select("doctor_profile_id, reminder_24h, reminder_2h");
  const doctorIds24h = (prefsRows || []).filter((p) => p.reminder_24h).map((p) => p.doctor_profile_id);
  const doctorIds2h = (prefsRows || []).filter((p) => p.reminder_2h).map((p) => p.doctor_profile_id);

  let sent24h = 0;
  let sent2h = 0;

  if (doctorIds24h.length > 0) {
    sent24h = await sendRemindersFor(admin, doctorIds24h, "reminder_24h_sent_at", 24, now);
  }
  if (doctorIds2h.length > 0) {
    sent2h = await sendRemindersFor(admin, doctorIds2h, "reminder_2h_sent_at", 2, now);
  }

  const reviewRequestsSent = await sendReviewRequests(admin, now);

  return NextResponse.json({ sent24h, sent2h, reviewRequestsSent });
}

// Fires 24h after the thank-you email went out (not after the visit itself,
// since staff may mark a visit complete and send the thank-you note well
// after it happened) -- review_requested_at guards against duplicate sends
// the same way the reminder columns do.
async function sendReviewRequests(admin: Awaited<ReturnType<typeof createAdminClient>>, now: Date): Promise<number> {
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const { data: appointments } = await admin
    .from("appointments")
    .select("id, doctor_profile_id, patient_email")
    .eq("status", "complete")
    .not("thank_you_sent_at", "is", null)
    .is("review_requested_at", null)
    .lte("thank_you_sent_at", cutoff.toISOString());

  let count = 0;
  for (const appt of appointments || []) {
    try {
      const { data: doctorProfile } = await admin.from("doctor_profiles").select("profile_id, credentials").eq("id", appt.doctor_profile_id).single();
      const { data: doctorAuthProfile } = await admin.from("profiles").select("full_name").eq("id", doctorProfile?.profile_id || "").single();
      const doctorName = `${doctorAuthProfile?.full_name || "your doctor"}${doctorProfile?.credentials ? `, ${doctorProfile.credentials}` : ""}`;

      const email = reviewRequestEmail({
        doctorName,
        reviewUrl: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/appointments/manage/${appt.id}/review`,
      });
      await sendEmail({ to: appt.patient_email, subject: email.subject, html: email.html });
      await admin.from("appointments").update({ review_requested_at: new Date().toISOString() }).eq("id", appt.id);
      count++;
    } catch (err) {
      console.error(`review request failed for ${appt.id}`, err);
    }
  }
  return count;
}

async function sendRemindersFor(
  admin: Awaited<ReturnType<typeof createAdminClient>>,
  doctorProfileIds: string[],
  sentAtColumn: "reminder_24h_sent_at" | "reminder_2h_sent_at",
  hoursAhead: 24 | 2,
  now: Date
): Promise<number> {
  const windowEnd = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

  const { data: appointments } = await admin
    .from("appointments")
    .select("id, doctor_profile_id, appointment_type_id, patient_email, start_at, is_telehealth, telehealth_room_url")
    .in("doctor_profile_id", doctorProfileIds)
    .eq("status", "confirmed")
    .is(sentAtColumn, null)
    .gte("start_at", now.toISOString())
    .lte("start_at", windowEnd.toISOString());

  let count = 0;
  for (const appt of appointments || []) {
    try {
      const [{ data: type }, { data: doctorProfile }] = await Promise.all([
        admin.from("appointment_types").select("name").eq("id", appt.appointment_type_id).single(),
        admin.from("doctor_profiles").select("profile_id, credentials").eq("id", appt.doctor_profile_id).single(),
      ]);
      const { data: doctorAuthProfile } = await admin.from("profiles").select("full_name").eq("id", doctorProfile?.profile_id || "").single();
      const doctorName = `${doctorAuthProfile?.full_name || "your doctor"}${doctorProfile?.credentials ? `, ${doctorProfile.credentials}` : ""}`;

      const email = appointmentReminderEmail({
        doctorName,
        appointmentTypeName: type?.name || "your appointment",
        start: appt.start_at,
        isTelehealth: appt.is_telehealth,
        telehealthRoomUrl: appt.telehealth_room_url,
        hoursAhead,
      });
      await sendEmail({ to: appt.patient_email, subject: email.subject, html: email.html });
      const sentAt = new Date().toISOString();
      const update = sentAtColumn === "reminder_24h_sent_at" ? { reminder_24h_sent_at: sentAt } : { reminder_2h_sent_at: sentAt };
      await admin.from("appointments").update(update).eq("id", appt.id);
      count++;
    } catch (err) {
      console.error(`appointment reminder (${hoursAhead}h) failed for ${appt.id}`, err);
    }
  }
  return count;
}
