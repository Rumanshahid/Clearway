"use server";

import { revalidatePath } from "next/cache";
import { getSessionProfile } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { appointmentCancelledEmail, noShowReengagementEmail, waitlistOfferEmail } from "@/lib/scheduling-emails";
import { draftThankYouEmail } from "@/lib/scheduling-anthropic";
import { offerNextWaitlistSlot } from "@/lib/scheduling";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) || "").trim();
}

// Feeds the "View" popup on the appointments list -- same data the old
// standalone detail page fetched, just callable directly from a client
// component instead of only reachable via a page navigation.
export async function getAppointmentDetailAction(id: string) {
  const session = await getSessionProfile();
  const supabase = await createClient();

  const { data: appointment } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", id)
    .eq("practice_id", session.practiceId)
    .single();
  if (!appointment) return null;

  const [{ data: type }, { data: intakeQuestions }, { data: preVisitIntake }] = await Promise.all([
    supabase.from("appointment_types").select("name").eq("id", appointment.appointment_type_id).single(),
    supabase.from("intake_questions").select("question_key, question_text").eq("doctor_profile_id", appointment.doctor_profile_id),
    supabase.from("pre_appointment_intake").select("*").eq("appointment_id", appointment.id).maybeSingle(),
  ]);

  return {
    appointment,
    typeName: type?.name || null,
    intakeQuestions: intakeQuestions || [],
    preVisitIntake: preVisitIntake || null,
  };
}

export type AppointmentDetail = NonNullable<Awaited<ReturnType<typeof getAppointmentDetailAction>>>;

export async function checkInAction(formData: FormData) {
  const session = await getSessionProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .update({ status: "checked_in" })
    .eq("id", str(formData, "id"))
    .eq("practice_id", session.practiceId);
  if (error) throw error;
  revalidatePath("/dashboard/appointments");
}

// Generates the AI thank-you draft but doesn't send it -- the doctor reviews
// and edits it on the appointment detail page before it goes out.
export async function markCompleteAction(formData: FormData) {
  const session = await getSessionProfile();
  const supabase = await createClient();
  const id = str(formData, "id");

  const { data: appointment, error } = await supabase
    .from("appointments")
    .update({ status: "complete" })
    .eq("id", id)
    .eq("practice_id", session.practiceId)
    .select("id, doctor_profile_id, appointment_type_id, patient_full_name, reason_for_visit")
    .single();
  if (error) throw error;

  try {
    const [{ data: type }, { data: doctorProfile }] = await Promise.all([
      supabase.from("appointment_types").select("name").eq("id", appointment.appointment_type_id).single(),
      supabase.from("doctor_profiles").select("profile_id, credentials").eq("id", appointment.doctor_profile_id).single(),
    ]);
    const { data: doctorAuthProfile } = await supabase.from("profiles").select("full_name").eq("id", doctorProfile?.profile_id || "").single();
    const doctorName = `Dr. ${doctorAuthProfile?.full_name || "your doctor"}${doctorProfile?.credentials ? `, ${doctorProfile.credentials}` : ""}`;
    const firstName = appointment.patient_full_name.split(" ")[0];

    const draft = await draftThankYouEmail({
      patientFirstName: firstName,
      doctorName,
      appointmentTypeName: type?.name || "your visit",
      reasonForVisit: appointment.reason_for_visit || "your visit",
    });

    await supabase.from("appointments").update({ thank_you_draft: draft }).eq("id", id);
  } catch (err) {
    // A thank-you draft is a nice-to-have on top of the visit itself --
    // failing to generate one (e.g. no ANTHROPIC_API_KEY) shouldn't block
    // marking the visit complete, which already succeeded above.
    console.error("thank-you draft generation failed", err);
  }

  revalidatePath("/dashboard/appointments");
  revalidatePath(`/dashboard/appointments/${id}`);
}

export async function markNoShowAction(formData: FormData) {
  const session = await getSessionProfile();
  const supabase = await createClient();
  const id = str(formData, "id");

  const { data: appointment, error } = await supabase
    .from("appointments")
    .update({ status: "no_show" })
    .eq("id", id)
    .eq("practice_id", session.practiceId)
    .select("patient_email, appointment_type_id, doctor_profile_id")
    .single();
  if (error) throw error;

  try {
    const [{ data: type }, { data: doctorProfile }] = await Promise.all([
      supabase.from("appointment_types").select("name").eq("id", appointment.appointment_type_id).single(),
      supabase.from("doctor_profiles").select("profile_id, credentials, slug").eq("id", appointment.doctor_profile_id).single(),
    ]);
    const { data: doctorAuthProfile } = await supabase.from("profiles").select("full_name").eq("id", doctorProfile?.profile_id || "").single();
    const doctorName = `${doctorAuthProfile?.full_name || "your doctor"}${doctorProfile?.credentials ? `, ${doctorProfile.credentials}` : ""}`;

    const email = noShowReengagementEmail({
      doctorName,
      appointmentTypeName: type?.name || "your appointment",
      rebookUrl: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/doctors/${doctorProfile?.slug || ""}`,
    });
    await sendEmail({ to: appointment.patient_email, subject: email.subject, html: email.html });
  } catch (err) {
    console.error("no-show re-engagement email failed", err);
  }

  revalidatePath("/dashboard/appointments");
}

export async function cancelAppointmentAction(formData: FormData) {
  const session = await getSessionProfile();
  const supabase = await createClient();
  const id = str(formData, "id");

  const { data: appointment, error } = await supabase
    .from("appointments")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancelled_reason: str(formData, "reason") || "Cancelled by staff" })
    .eq("id", id)
    .eq("practice_id", session.practiceId)
    .select("patient_email, appointment_type_id, doctor_profile_id, start_at, end_at")
    .single();
  if (error) throw error;

  try {
    const [{ data: type }, { data: doctorProfile }] = await Promise.all([
      supabase.from("appointment_types").select("name").eq("id", appointment.appointment_type_id).single(),
      supabase.from("doctor_profiles").select("profile_id, credentials, slug").eq("id", appointment.doctor_profile_id).single(),
    ]);
    const { data: doctorAuthProfile } = await supabase.from("profiles").select("full_name").eq("id", doctorProfile?.profile_id || "").single();
    const doctorName = `${doctorAuthProfile?.full_name || "your doctor"}${doctorProfile?.credentials ? `, ${doctorProfile.credentials}` : ""}`;

    const email = appointmentCancelledEmail({
      doctorName,
      appointmentTypeName: type?.name || "your appointment",
      start: appointment.start_at,
      rebookUrl: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/doctors/${doctorProfile?.slug || ""}`,
    });
    await sendEmail({ to: appointment.patient_email, subject: email.subject, html: email.html });

    const offer = await offerNextWaitlistSlot(supabase, appointment.doctor_profile_id, appointment.appointment_type_id, appointment.start_at, appointment.end_at);
    if (offer) {
      const offerEmail = waitlistOfferEmail({
        doctorName,
        appointmentTypeName: type?.name || "your appointment",
        start: appointment.start_at,
        confirmUrl: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/appointments/waitlist/${offer.waitlistId}/confirm`,
      });
      await sendEmail({ to: offer.patientEmail, subject: offerEmail.subject, html: offerEmail.html });
    }
  } catch (err) {
    console.error("cancellation email failed", err);
  }

  revalidatePath("/dashboard/appointments");
}

export async function regenerateThankYouDraftAction(formData: FormData) {
  const session = await getSessionProfile();
  const supabase = await createClient();
  const id = str(formData, "id");

  const { data: appointment } = await supabase
    .from("appointments")
    .select("doctor_profile_id, appointment_type_id, patient_full_name, reason_for_visit")
    .eq("id", id)
    .eq("practice_id", session.practiceId)
    .single();
  if (!appointment) throw new Error("Appointment not found");

  const [{ data: type }, { data: doctorProfile }] = await Promise.all([
    supabase.from("appointment_types").select("name").eq("id", appointment.appointment_type_id).single(),
    supabase.from("doctor_profiles").select("profile_id, credentials").eq("id", appointment.doctor_profile_id).single(),
  ]);
  const { data: doctorAuthProfile } = await supabase.from("profiles").select("full_name").eq("id", doctorProfile?.profile_id || "").single();
  const doctorName = `Dr. ${doctorAuthProfile?.full_name || "your doctor"}${doctorProfile?.credentials ? `, ${doctorProfile.credentials}` : ""}`;

  const draft = await draftThankYouEmail({
    patientFirstName: appointment.patient_full_name.split(" ")[0],
    doctorName,
    appointmentTypeName: type?.name || "your visit",
    reasonForVisit: appointment.reason_for_visit || "your visit",
  });

  await supabase.from("appointments").update({ thank_you_draft: draft }).eq("id", id).eq("practice_id", session.practiceId);
  revalidatePath(`/dashboard/appointments/${id}`);
}

export async function sendThankYouEmailAction(formData: FormData) {
  const session = await getSessionProfile();
  const supabase = await createClient();
  const id = str(formData, "id");
  const editedBody = str(formData, "body");

  const { data: appointment } = await supabase
    .from("appointments")
    .select("patient_email, patient_full_name")
    .eq("id", id)
    .eq("practice_id", session.practiceId)
    .single();
  if (!appointment) throw new Error("Appointment not found");

  await sendEmail({
    to: appointment.patient_email,
    subject: `Thank you for your visit, ${appointment.patient_full_name.split(" ")[0]}`,
    html: editedBody
      .split("\n\n")
      .map((para) => `<p>${para}</p>`)
      .join(""),
  });

  await supabase
    .from("appointments")
    .update({ thank_you_draft: editedBody, thank_you_sent_at: new Date().toISOString() })
    .eq("id", id)
    .eq("practice_id", session.practiceId);

  revalidatePath(`/dashboard/appointments/${id}`);
}
