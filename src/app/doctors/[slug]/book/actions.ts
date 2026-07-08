"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getOpenSlots, createBooking, getOrCreateSingleAppointmentType, type BookingResult, type SlotWindow } from "@/lib/scheduling";
import { interpretIntake } from "@/lib/scheduling-anthropic";
import { bookingConfirmationEmail, doctorNewBookingEmail } from "@/lib/scheduling-emails";
import { sendEmail } from "@/lib/email";
import { notify } from "@/lib/notifications";
import { createTelehealthRoom } from "@/lib/telehealth";
import { checkInsuranceEligibility } from "@/lib/insurance-eligibility";

export interface RoutingAndSlotsResult {
  appointmentTypeId: string;
  appointmentTypeName: string;
  isNewPatient: boolean;
  isUrgent: boolean;
  isTelehealth: boolean;
  reasonForVisit: string;
  slots: SlotWindow[];
}

/**
 * Every doctor now has exactly one bookable appointment type, so there's
 * nothing to route between -- the one Claude call here is just reading the
 * patient's answers for the genuinely fuzzy part (new vs returning, urgency,
 * a plain-language reason for staff), while the actual open times come from
 * the deterministic slot engine.
 */
export async function routeAndGetSlotsAction(
  doctorSlug: string,
  answersByQuestionText: Record<string, string>
): Promise<RoutingAndSlotsResult | { error: string }> {
  const supabase = await createAdminClient();

  const { data: doctor } = await supabase.from("doctor_profiles").select("id, practice_id").eq("slug", doctorSlug).eq("public_enabled", true).maybeSingle();
  if (!doctor) return { error: "not_found" };

  const type = await getOrCreateSingleAppointmentType(supabase, doctor.practice_id, doctor.id);
  const interpreted = await interpretIntake(answersByQuestionText);

  const from = new Date();
  const to = new Date(from.getTime() + 30 * 24 * 60 * 60 * 1000);
  const slots = await getOpenSlots(supabase, doctor.id, type.id, from, to);

  return {
    appointmentTypeId: type.id,
    appointmentTypeName: type.name,
    isNewPatient: interpreted.isNewPatient,
    isUrgent: interpreted.isUrgent,
    isTelehealth: type.is_telehealth,
    reasonForVisit: interpreted.reasonForVisit,
    slots: slots.slice(0, 8),
  };
}

export interface SubmitBookingInput {
  doctorSlug: string;
  appointmentTypeId: string;
  start: string;
  end: string;
  isNewPatient: boolean;
  isTelehealth: boolean;
  isUrgent: boolean;
  reasonForVisit: string;
  intakeAnswers: Record<string, string>;
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
    isNewPatient: input.isNewPatient,
    isTelehealth: input.isTelehealth,
    reasonForVisit: input.reasonForVisit,
    intakeAnswers: input.intakeAnswers,
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
      isNewPatient: input.isNewPatient,
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
        isUrgent: input.isUrgent,
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
  isNewPatient: boolean;
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
  const { data: type } = await supabase.from("appointment_types").select("duration_minutes").eq("id", input.appointmentTypeId).single();
  const durationMinutes = type?.duration_minutes ?? 30;

  let bookedCount = 0;
  const skippedDates: string[] = [];

  for (let i = 1; i < input.totalOccurrences; i++) {
    const start = new Date(firstStartDate.getTime() + i * input.intervalWeeks * 7 * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

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
