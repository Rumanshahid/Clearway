"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getOpenSlots, createBooking, offerNextWaitlistSlot, type SlotWindow } from "@/lib/scheduling";
import { sendEmail } from "@/lib/email";
import { appointmentCancelledEmail, bookingConfirmationEmail, waitlistOfferEmail } from "@/lib/scheduling-emails";

async function loadContext(supabase: Awaited<ReturnType<typeof createAdminClient>>, appointmentId: string) {
  const { data: appointment } = await supabase.from("appointments").select("*").eq("id", appointmentId).maybeSingle();
  if (!appointment) return null;

  const [{ data: type }, { data: doctorProfile }] = await Promise.all([
    supabase.from("appointment_types").select("name").eq("id", appointment.appointment_type_id).single(),
    supabase.from("doctor_profiles").select("profile_id, credentials, slug").eq("id", appointment.doctor_profile_id).single(),
  ]);
  const { data: doctorAuthProfile } = await supabase.from("profiles").select("full_name").eq("id", doctorProfile?.profile_id || "").single();
  const doctorName = `${doctorAuthProfile?.full_name || "your doctor"}${doctorProfile?.credentials ? `, ${doctorProfile.credentials}` : ""}`;

  return { appointment, typeName: type?.name || "your appointment", doctorName, doctorSlug: doctorProfile?.slug || "" };
}

async function offerFreedSlotToWaitlist(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  doctorProfileId: string,
  appointmentTypeId: string,
  start: string,
  end: string,
  doctorName: string,
  typeName: string
) {
  const offer = await offerNextWaitlistSlot(supabase, doctorProfileId, appointmentTypeId, start, end);
  if (!offer) return;
  const email = waitlistOfferEmail({
    doctorName,
    appointmentTypeName: typeName,
    start,
    confirmUrl: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/appointments/waitlist/${offer.waitlistId}/confirm`,
  });
  try {
    await sendEmail({ to: offer.patientEmail, subject: email.subject, html: email.html });
  } catch (err) {
    console.error("waitlist offer email failed", err);
  }
}

export async function patientCancelAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const id = String(formData.get("id") || "");
  const supabase = await createAdminClient();
  const ctx = await loadContext(supabase, id);
  if (!ctx) return { ok: false, error: "not_found" };
  if (ctx.appointment.status !== "confirmed" && ctx.appointment.status !== "checked_in") {
    return { ok: false, error: "not_cancellable" };
  }

  const { error } = await supabase
    .from("appointments")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancelled_reason: "Cancelled by patient" })
    .eq("id", id);
  if (error) throw error;

  const email = appointmentCancelledEmail({
    doctorName: ctx.doctorName,
    appointmentTypeName: ctx.typeName,
    start: ctx.appointment.start_at,
    rebookUrl: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/doctors/${ctx.doctorSlug}`,
  });
  try {
    await sendEmail({ to: ctx.appointment.patient_email, subject: email.subject, html: email.html });
  } catch (err) {
    console.error("patient cancellation email failed", err);
  }

  await offerFreedSlotToWaitlist(
    supabase,
    ctx.appointment.doctor_profile_id,
    ctx.appointment.appointment_type_id,
    ctx.appointment.start_at,
    ctx.appointment.end_at,
    ctx.doctorName,
    ctx.typeName
  );

  return { ok: true };
}

export async function getRescheduleSlotsAction(appointmentId: string): Promise<SlotWindow[]> {
  const supabase = await createAdminClient();
  const { data: appointment } = await supabase
    .from("appointments")
    .select("doctor_profile_id, appointment_type_id")
    .eq("id", appointmentId)
    .maybeSingle();
  if (!appointment) return [];

  const from = new Date();
  const to = new Date(from.getTime() + 30 * 24 * 60 * 60 * 1000);
  return getOpenSlots(supabase, appointment.doctor_profile_id, appointment.appointment_type_id, from, to);
}

export async function patientRescheduleAction(
  appointmentId: string,
  newStart: string,
  newEnd: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createAdminClient();
  const ctx = await loadContext(supabase, appointmentId);
  if (!ctx) return { ok: false, error: "not_found" };
  if (ctx.appointment.status !== "confirmed" && ctx.appointment.status !== "checked_in") {
    return { ok: false, error: "not_cancellable" };
  }

  const bookingResult = await createBooking(supabase, {
    doctorProfileId: ctx.appointment.doctor_profile_id,
    appointmentTypeId: ctx.appointment.appointment_type_id,
    start: newStart,
    end: newEnd,
    patientFullName: ctx.appointment.patient_full_name,
    patientPhone: ctx.appointment.patient_phone,
    patientEmail: ctx.appointment.patient_email,
    patientDob: ctx.appointment.patient_dob || undefined,
    patientInsuranceCompany: ctx.appointment.patient_insurance_company || undefined,
    patientMemberId: ctx.appointment.patient_member_id || undefined,
    patientNotes: ctx.appointment.patient_notes || undefined,
    isNewPatient: ctx.appointment.is_new_patient,
    isTelehealth: ctx.appointment.is_telehealth,
    reasonForVisit: ctx.appointment.reason_for_visit || undefined,
    intakeAnswers: ctx.appointment.intake_answers,
  });
  if (!bookingResult.ok) return { ok: false, error: bookingResult.error };

  const oldStart = ctx.appointment.start_at;
  const oldEnd = ctx.appointment.end_at;
  await supabase
    .from("appointments")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancelled_reason: "Rescheduled by patient" })
    .eq("id", appointmentId);

  const confirmation = bookingConfirmationEmail({
    doctorName: ctx.doctorName,
    appointmentTypeName: ctx.typeName,
    start: newStart,
    isTelehealth: ctx.appointment.is_telehealth,
    isNewPatient: ctx.appointment.is_new_patient,
    cancellationPolicyHours: 24,
  });
  try {
    await sendEmail({ to: ctx.appointment.patient_email, subject: `Rescheduled: ${confirmation.subject}`, html: confirmation.html });
  } catch (err) {
    console.error("reschedule confirmation email failed", err);
  }

  await offerFreedSlotToWaitlist(
    supabase,
    ctx.appointment.doctor_profile_id,
    ctx.appointment.appointment_type_id,
    oldStart,
    oldEnd,
    ctx.doctorName,
    ctx.typeName
  );

  return { ok: true };
}
