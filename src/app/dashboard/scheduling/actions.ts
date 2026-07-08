"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/permissions";

// A practice can have several doctors; RLS only scopes by practice_id, so it
// alone wouldn't stop one doctor from editing a colleague's schedule. Every
// mutation here additionally checks the row's profile_id against the caller.
async function assertOwnsDoctorProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  doctorProfileId: string,
  callerUserId: string
) {
  const { data } = await supabase.from("doctor_profiles").select("profile_id").eq("id", doctorProfileId).single();
  if (!data || data.profile_id !== callerUserId) {
    throw new Error("You can only edit your own scheduling profile.");
  }
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) || "").trim();
}

function parseList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function saveDoctorProfileAction(formData: FormData) {
  const session = await requireAdmin();
  const supabase = await createClient();
  const doctorProfileId = str(formData, "doctor_profile_id");
  await assertOwnsDoctorProfile(supabase, doctorProfileId, session.userId);

  const { error } = await supabase
    .from("doctor_profiles")
    .update({
      public_enabled: formData.get("public_enabled") === "on",
      credentials: str(formData, "credentials") || null,
      specialty: str(formData, "specialty") || null,
      sub_specialties: parseList(str(formData, "sub_specialties")),
      photo_url: str(formData, "photo_url") || null,
      bio: str(formData, "bio") || null,
      conditions_treated: parseList(str(formData, "conditions_treated")),
      insurance_accepted: formData.getAll("insurance_accepted").map(String),
      languages: formData.getAll("languages").map(String),
      accepting_new_patients: formData.get("accepting_new_patients") === "on",
      telehealth_available: formData.get("telehealth_available") === "on",
      address_line1: str(formData, "address_line1") || null,
      city: str(formData, "city") || null,
      state: str(formData, "state") || null,
      zip: str(formData, "zip") || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", doctorProfileId);
  if (error) throw error;

  revalidatePath("/dashboard/scheduling");
  redirect("/dashboard/scheduling?saved=1");
}

interface AvailabilityBlock {
  weekday: number;
  start_time: string;
  end_time: string;
}

export async function saveAvailabilityAction(formData: FormData) {
  const session = await requireAdmin();
  const supabase = await createClient();
  const doctorProfileId = str(formData, "doctor_profile_id");
  await assertOwnsDoctorProfile(supabase, doctorProfileId, session.userId);

  const blocks: AvailabilityBlock[] = JSON.parse(str(formData, "blocks") || "[]");

  const { error: deleteError } = await supabase.from("doctor_availability").delete().eq("doctor_profile_id", doctorProfileId);
  if (deleteError) throw deleteError;

  if (blocks.length) {
    const { error: insertError } = await supabase.from("doctor_availability").insert(
      blocks
        .filter((b) => b.start_time && b.end_time && b.end_time > b.start_time)
        .map((b) => ({
          practice_id: session.practiceId,
          doctor_profile_id: doctorProfileId,
          weekday: b.weekday,
          start_time: b.start_time,
          end_time: b.end_time,
        }))
    );
    if (insertError) throw insertError;
  }

  const minNoticeHours = Number(str(formData, "min_notice_hours") || 24);
  const maxAdvanceDays = Number(str(formData, "max_advance_days") || 90);
  const maxAppointmentsPerDayRaw = str(formData, "max_appointments_per_day");

  const { error: updateError } = await supabase
    .from("doctor_profiles")
    .update({
      timezone: str(formData, "timezone") || "America/New_York",
      min_notice_hours: minNoticeHours,
      max_advance_days: maxAdvanceDays,
      max_appointments_per_day: maxAppointmentsPerDayRaw ? Number(maxAppointmentsPerDayRaw) : null,
    })
    .eq("id", doctorProfileId);
  if (updateError) throw updateError;

  revalidatePath("/dashboard/scheduling/availability");
  redirect("/dashboard/scheduling/availability");
}

export async function addBlackoutDateAction(formData: FormData) {
  const session = await requireAdmin();
  const supabase = await createClient();
  const doctorProfileId = str(formData, "doctor_profile_id");
  await assertOwnsDoctorProfile(supabase, doctorProfileId, session.userId);

  const { error } = await supabase.from("blackout_dates").insert({
    practice_id: session.practiceId,
    doctor_profile_id: doctorProfileId,
    date: str(formData, "date"),
    reason: str(formData, "reason") || null,
  });
  if (error) throw error;

  revalidatePath("/dashboard/scheduling/availability");
  redirect("/dashboard/scheduling/availability");
}

export async function deleteBlackoutDateAction(formData: FormData) {
  const session = await requireAdmin();
  const supabase = await createClient();
  const doctorProfileId = str(formData, "doctor_profile_id");
  await assertOwnsDoctorProfile(supabase, doctorProfileId, session.userId);

  const { error } = await supabase.from("blackout_dates").delete().eq("id", str(formData, "id")).eq("doctor_profile_id", doctorProfileId);
  if (error) throw error;

  revalidatePath("/dashboard/scheduling/availability");
  redirect("/dashboard/scheduling/availability");
}

export async function createAppointmentTypeAction(formData: FormData) {
  const session = await requireAdmin();
  const supabase = await createClient();
  const doctorProfileId = str(formData, "doctor_profile_id");
  await assertOwnsDoctorProfile(supabase, doctorProfileId, session.userId);

  const { error } = await supabase.from("appointment_types").insert({
    practice_id: session.practiceId,
    doctor_profile_id: doctorProfileId,
    name: str(formData, "name"),
    duration_minutes: Number(str(formData, "duration_minutes") || 30),
    buffer_minutes: Number(str(formData, "buffer_minutes") || 0),
    is_new_patient: formData.get("is_new_patient") === "on",
    is_telehealth: formData.get("is_telehealth") === "on",
  });
  if (error) throw error;

  revalidatePath("/dashboard/scheduling/appointment-types");
  redirect("/dashboard/scheduling/appointment-types");
}

export async function updateAppointmentTypeAction(formData: FormData) {
  const session = await requireAdmin();
  const supabase = await createClient();
  const doctorProfileId = str(formData, "doctor_profile_id");
  await assertOwnsDoctorProfile(supabase, doctorProfileId, session.userId);

  const { error } = await supabase
    .from("appointment_types")
    .update({
      name: str(formData, "name"),
      duration_minutes: Number(str(formData, "duration_minutes") || 30),
      buffer_minutes: Number(str(formData, "buffer_minutes") || 0),
      is_new_patient: formData.get("is_new_patient") === "on",
      is_telehealth: formData.get("is_telehealth") === "on",
      active: formData.get("active") === "on",
    })
    .eq("id", str(formData, "id"))
    .eq("doctor_profile_id", doctorProfileId);
  if (error) throw error;

  revalidatePath("/dashboard/scheduling/appointment-types");
  redirect("/dashboard/scheduling/appointment-types");
}

export async function deleteAppointmentTypeAction(formData: FormData) {
  const session = await requireAdmin();
  const supabase = await createClient();
  const doctorProfileId = str(formData, "doctor_profile_id");
  await assertOwnsDoctorProfile(supabase, doctorProfileId, session.userId);

  const { error } = await supabase.from("appointment_types").delete().eq("id", str(formData, "id")).eq("doctor_profile_id", doctorProfileId);
  if (error) throw error;

  revalidatePath("/dashboard/scheduling/appointment-types");
  redirect("/dashboard/scheduling/appointment-types");
}

export async function addIntakeQuestionAction(formData: FormData) {
  const session = await requireAdmin();
  const supabase = await createClient();
  const doctorProfileId = str(formData, "doctor_profile_id");
  await assertOwnsDoctorProfile(supabase, doctorProfileId, session.userId);

  const { count } = await supabase
    .from("intake_questions")
    .select("id", { count: "exact", head: true })
    .eq("doctor_profile_id", doctorProfileId);

  const { error } = await supabase.from("intake_questions").insert({
    practice_id: session.practiceId,
    doctor_profile_id: doctorProfileId,
    question_key: null,
    question_text: str(formData, "question_text"),
    sort_order: count || 0,
  });
  if (error) throw error;

  revalidatePath("/dashboard/scheduling/intake-questions");
  redirect("/dashboard/scheduling/intake-questions");
}

export async function updateIntakeQuestionAction(formData: FormData) {
  const session = await requireAdmin();
  const supabase = await createClient();
  const doctorProfileId = str(formData, "doctor_profile_id");
  await assertOwnsDoctorProfile(supabase, doctorProfileId, session.userId);

  const { error } = await supabase
    .from("intake_questions")
    .update({
      question_text: str(formData, "question_text"),
      active: formData.get("active") === "on",
    })
    .eq("id", str(formData, "id"))
    .eq("doctor_profile_id", doctorProfileId);
  if (error) throw error;

  revalidatePath("/dashboard/scheduling/intake-questions");
  redirect("/dashboard/scheduling/intake-questions");
}

export async function deleteIntakeQuestionAction(formData: FormData) {
  const session = await requireAdmin();
  const supabase = await createClient();
  const doctorProfileId = str(formData, "doctor_profile_id");
  await assertOwnsDoctorProfile(supabase, doctorProfileId, session.userId);

  // question_key is null-checked at the DB layer implicitly -- the UI only
  // renders a delete button for custom (question_key null) questions, but
  // enforce it here too since a form post can't be trusted from the client.
  const { data: question } = await supabase
    .from("intake_questions")
    .select("question_key")
    .eq("id", str(formData, "id"))
    .eq("doctor_profile_id", doctorProfileId)
    .single();
  if (question?.question_key) throw new Error("The default intake questions can't be deleted, only edited or deactivated.");

  const { error } = await supabase.from("intake_questions").delete().eq("id", str(formData, "id")).eq("doctor_profile_id", doctorProfileId);
  if (error) throw error;

  revalidatePath("/dashboard/scheduling/intake-questions");
  redirect("/dashboard/scheduling/intake-questions");
}

export async function saveNotificationPrefsAction(formData: FormData) {
  const session = await requireAdmin();
  const supabase = await createClient();
  const doctorProfileId = str(formData, "doctor_profile_id");
  await assertOwnsDoctorProfile(supabase, doctorProfileId, session.userId);

  const { error } = await supabase
    .from("notification_prefs")
    .update({
      email_new_booking: formData.get("email_new_booking") === "on",
      sms_new_booking: formData.get("sms_new_booking") === "on",
      daily_summary_email: formData.get("daily_summary_email") === "on",
      reminder_24h: formData.get("reminder_24h") === "on",
      reminder_2h: formData.get("reminder_2h") === "on",
      cancellation_policy_hours: Number(str(formData, "cancellation_policy_hours") || 24),
    })
    .eq("doctor_profile_id", doctorProfileId);
  if (error) throw error;

  revalidatePath("/dashboard/scheduling/notifications");
  redirect("/dashboard/scheduling/notifications");
}
