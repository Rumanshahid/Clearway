"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { createBooking } from "@/lib/scheduling";
import { sendEmail } from "@/lib/email";
import { bookingConfirmationEmail } from "@/lib/scheduling-emails";

export type ConfirmWaitlistResult = { ok: true; appointmentId: string } | { ok: false; error: "not_found" | "expired" | "slot_taken" | "already_used" };

export async function confirmWaitlistOfferAction(waitlistId: string): Promise<ConfirmWaitlistResult> {
  const supabase = await createAdminClient();

  const { data: entry } = await supabase.from("waitlist").select("*").eq("id", waitlistId).maybeSingle();
  if (!entry) return { ok: false, error: "not_found" };
  if (entry.status === "booked") return { ok: false, error: "already_used" };
  if (entry.status !== "offered" || !entry.offered_start_at || !entry.offered_end_at || !entry.offer_expires_at) {
    return { ok: false, error: "not_found" };
  }
  if (new Date(entry.offer_expires_at) < new Date()) {
    await supabase.from("waitlist").update({ status: "expired" }).eq("id", waitlistId);
    return { ok: false, error: "expired" };
  }

  const result = await createBooking(supabase, {
    doctorProfileId: entry.doctor_profile_id,
    appointmentTypeId: entry.appointment_type_id,
    start: entry.offered_start_at,
    end: entry.offered_end_at,
    patientFullName: entry.patient_full_name,
    patientPhone: entry.patient_phone,
    patientEmail: entry.patient_email,
    isNewPatient: false,
    isTelehealth: false,
  });
  if (!result.ok) return { ok: false, error: result.error };

  await supabase.from("waitlist").update({ status: "booked" }).eq("id", waitlistId);

  const [{ data: type }, { data: doctorProfile }] = await Promise.all([
    supabase.from("appointment_types").select("name").eq("id", entry.appointment_type_id).single(),
    supabase.from("doctor_profiles").select("profile_id, credentials").eq("id", entry.doctor_profile_id).single(),
  ]);
  const { data: doctorAuthProfile } = await supabase.from("profiles").select("full_name").eq("id", doctorProfile?.profile_id || "").single();
  const doctorName = `${doctorAuthProfile?.full_name || "your doctor"}${doctorProfile?.credentials ? `, ${doctorProfile.credentials}` : ""}`;

  const confirmation = bookingConfirmationEmail({
    doctorName,
    appointmentTypeName: type?.name || "your appointment",
    start: entry.offered_start_at,
    isTelehealth: false,
    isNewPatient: false,
    cancellationPolicyHours: 24,
    manageUrl: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/appointments/manage/${result.appointmentId}`,
  });
  try {
    await sendEmail({ to: entry.patient_email, subject: confirmation.subject, html: confirmation.html });
  } catch (err) {
    console.error("waitlist confirmation email failed", err);
  }

  return { ok: true, appointmentId: result.appointmentId };
}
