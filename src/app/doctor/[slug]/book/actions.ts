"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getOpenSlots, createBooking, getOrCreateSingleAppointmentType, type BookingResult, type SlotWindow } from "@/lib/scheduling";
import { bookingConfirmationEmail, doctorNewBookingEmail } from "@/lib/scheduling-emails";
import { sendEmail } from "@/lib/email";
import { notify } from "@/lib/notifications";
import { createTelehealthRoom } from "@/lib/telehealth";
import { checkInsuranceEligibility } from "@/lib/insurance-eligibility";

export interface RoutingAndSlotsResult {
  appointmentTypeId: string;
  appointmentTypeName: string;
  isTelehealth: boolean;
  durationMinutes: number;
  reasonForVisit: string;
  slots: SlotWindow[];
}

/**
 * The patient picks duration and telehealth-vs-in-person directly in the
 * booking chat now, so there's nothing left to infer with AI here -- slots
 * come straight from the deterministic engine using exactly what they
 * chose, rather than the doctor's stored default appointment length.
 */
export async function routeAndGetSlotsAction(
  doctorSlug: string,
  reasonForVisit: string,
  durationMinutes: number,
  isTelehealth: boolean
): Promise<RoutingAndSlotsResult | { error: string }> {
  const supabase = await createAdminClient();

  const { data: doctor } = await supabase.from("doctor_profiles").select("id, practice_id").eq("slug", doctorSlug).eq("public_enabled", true).maybeSingle();
  if (!doctor) return { error: "not_found" };

  const type = await getOrCreateSingleAppointmentType(supabase, doctor.practice_id, doctor.id);

  const from = new Date();
  const to = new Date(from.getTime() + 30 * 24 * 60 * 60 * 1000);
  const slots = await getOpenSlots(supabase, doctor.id, type.id, from, to, durationMinutes);

  return {
    appointmentTypeId: type.id,
    appointmentTypeName: type.name,
    isTelehealth,
    durationMinutes,
    reasonForVisit,
    slots: slots.slice(0, 8),
  };
}

export interface SubmitBookingInput {
  doctorSlug: string;
  appointmentTypeId: string;
  start: string;
  end: string;
  isTelehealth: boolean;
  reasonForVisit: string;
  patientFullName: string;
  patientDob: string;
  patientPhone: string;
  patientEmail: string;
  patientInsuranceCompany: string;
  patientMemberId: string;
  patientNotes: string;
}

export async function submitBookingAction(input: SubmitBookingInput): Promise<BookingResult | { ok: false; error: "not_found" }> {
  const supabase = await createAdminClient();
  const { data: doctor } = await supabase
    .from("doctor_profiles")
    .select("id, profile_id, credentials")
    .eq("slug", input.doctorSlug)
    .eq("public_enabled", true)
    .maybeSingle();
  if (!doctor) return { ok: false, error: "not_found" };

  // The chat no longer asks new-vs-returning or urgency directly -- purpose
  // of visit, duration, and telehealth-vs-in-person are the only signals it
  // collects now. isNewPatient defaults true (safer messaging: mention
  // bringing referral paperwork/ID) and isUrgent false (no signal to flag
  // urgent from); front-desk staff still see the patient's own words via
  // reasonForVisit.
  const isNewPatient = true;
  const isUrgent = false;

  const result = await createBooking(supabase, {
    doctorProfileId: doctor.id,
    appointmentTypeId: input.appointmentTypeId,
    start: input.start,
    end: input.end,
    patientFullName: input.patientFullName,
    patientPhone: input.patientPhone,
    patientEmail: input.patientEmail,
    patientDob: input.patientDob || undefined,
    patientInsuranceCompany: input.patientInsuranceCompany || undefined,
    patientMemberId: input.patientMemberId || undefined,
    patientNotes: input.patientNotes || undefined,
    isNewPatient,
    isTelehealth: input.isTelehealth,
    reasonForVisit: input.reasonForVisit,
  });

  if (result.ok) {
    if (input.isTelehealth) {
      const roomUrl = await createTelehealthRoom(result.appointmentId, input.end);
      if (roomUrl) await supabase.from("appointments").update({ telehealth_room_url: roomUrl }).eq("id", result.appointmentId);
    }
    if (input.patientInsuranceCompany || input.patientMemberId) {
      const eligibility = await checkInsuranceEligibility({
        insuranceCompany: input.patientInsuranceCompany || null,
        memberId: input.patientMemberId || null,
      });
      await supabase.from("appointments").update({ insurance_verification_status: eligibility }).eq("id", result.appointmentId);
    }

    const [{ data: type }, { data: profile }, { data: prefs }] = await Promise.all([
      supabase.from("appointment_types").select("name").eq("id", input.appointmentTypeId).single(),
      supabase.from("profiles").select("full_name").eq("id", doctor.profile_id).single(),
      supabase.from("notification_prefs").select("email_new_booking, cancellation_policy_hours").eq("doctor_profile_id", doctor.id).single(),
    ]);
    const doctorName = `${profile?.full_name || "your doctor"}${doctor.credentials ? `, ${doctor.credentials}` : ""}`;

    const confirmation = bookingConfirmationEmail({
      doctorName,
      appointmentTypeName: type?.name || "your appointment",
      start: input.start,
      isTelehealth: input.isTelehealth,
      isNewPatient,
      cancellationPolicyHours: prefs?.cancellation_policy_hours ?? 24,
      manageUrl: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/appointments/manage/${result.appointmentId}`,
    });
    try {
      await sendEmail({ to: input.patientEmail, subject: confirmation.subject, html: confirmation.html });
    } catch (err) {
      console.error("booking confirmation email failed", err);
    }

    if (prefs?.email_new_booking !== false) {
      // profiles has no email column (that lives on auth.users) -- look it up
      // via the admin API.
      const { data: authUser } = await supabase.auth.admin.getUserById(doctor.profile_id);
      const doctorEmail = authUser?.user?.email;
      const notifyEmail = doctorNewBookingEmail({
        patientFullName: input.patientFullName,
        appointmentTypeName: type?.name || "Appointment",
        start: input.start,
        reasonForVisit: input.reasonForVisit,
        isUrgent,
      });
      await notify({
        userId: doctor.profile_id,
        email: doctorEmail,
        type: "new_appointment",
        message: `New booking: ${input.patientFullName} — ${type?.name || "appointment"}`,
        link: `/dashboard/appointments/${result.appointmentId}`,
        emailSubject: notifyEmail.subject,
        emailHtml: notifyEmail.html,
      });
    }
  }

  return result;
}

export interface RecurringSeriesInput {
  doctorSlug: string;
  appointmentTypeId: string;
  firstStart: string;
  intervalWeeks: number;
  totalOccurrences: number; // includes the already-booked first one
  durationMinutes: number;
  isTelehealth: boolean;
  patientFullName: string;
  patientPhone: string;
  patientEmail: string;
  patientDob: string;
  patientInsuranceCompany: string;
  patientMemberId: string;
}

/**
 * Books occurrences 2..N of a recurring series at the same time of day,
 * `intervalWeeks` apart. Each one goes through the same createBooking check
 * as any other slot -- if a future occurrence happens to already be taken,
 * it's skipped rather than failing the whole series, since most of the
 * series succeeding is more useful to the patient than none of it.
 */
export async function bookRecurringSeriesAction(input: RecurringSeriesInput): Promise<{ bookedCount: number; skippedDates: string[] }> {
  const supabase = await createAdminClient();
  const { data: doctor } = await supabase
    .from("doctor_profiles")
    .select("id")
    .eq("slug", input.doctorSlug)
    .eq("public_enabled", true)
    .maybeSingle();
  if (!doctor) return { bookedCount: 0, skippedDates: [] };

  const firstStartDate = new Date(input.firstStart);

  let bookedCount = 0;
  const skippedDates: string[] = [];

  for (let i = 1; i < input.totalOccurrences; i++) {
    const start = new Date(firstStartDate.getTime() + i * input.intervalWeeks * 7 * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + input.durationMinutes * 60 * 1000);

    const result = await createBooking(supabase, {
      doctorProfileId: doctor.id,
      appointmentTypeId: input.appointmentTypeId,
      start: start.toISOString(),
      end: end.toISOString(),
      patientFullName: input.patientFullName,
      patientPhone: input.patientPhone,
      patientEmail: input.patientEmail,
      patientDob: input.patientDob || undefined,
      patientInsuranceCompany: input.patientInsuranceCompany || undefined,
      patientMemberId: input.patientMemberId || undefined,
      isNewPatient: false,
      isTelehealth: input.isTelehealth,
      reasonForVisit: "Recurring follow-up",
    });

    if (result.ok) {
      bookedCount++;
    } else {
      skippedDates.push(start.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
    }
  }

  return { bookedCount, skippedDates };
}

export async function joinWaitlistAction(
  doctorSlug: string,
  appointmentTypeId: string,
  patientFullName: string,
  patientPhone: string,
  patientEmail: string
): Promise<{ ok: boolean }> {
  const supabase = await createAdminClient();
  const { data: doctor } = await supabase.from("doctor_profiles").select("id, practice_id").eq("slug", doctorSlug).eq("public_enabled", true).maybeSingle();
  if (!doctor) return { ok: false };

  const { error } = await supabase.from("waitlist").insert({
    practice_id: doctor.practice_id,
    doctor_profile_id: doctor.id,
    appointment_type_id: appointmentTypeId,
    patient_full_name: patientFullName,
    patient_phone: patientPhone,
    patient_email: patientEmail,
  });
  return { ok: !error };
}
