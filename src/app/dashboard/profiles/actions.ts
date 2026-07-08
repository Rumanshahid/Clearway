"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

interface HourBlock {
  weekday: number;
  start_time: string;
  end_time: string;
}

// Self-editable only — title and role stay admin-controlled via the Team
// page (dashboard/team/actions.ts). RLS (profiles_update_own) already
// restricts writes to your own row; this re-check exists so the form being
// hidden for other people's cards in the UI isn't the only thing stopping
// someone from POSTing a different member_id directly.
export async function updateProfileAction(formData: FormData) {
  const session = await getSessionProfile();
  const supabase = await createClient();

  const memberId = String(formData.get("member_id") || "");
  const fullName = String(formData.get("full_name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const avatarFile = formData.get("avatar") as File | null;

  if (memberId !== session.userId) {
    redirect(`/dashboard/profiles?error=${encodeURIComponent("You can only edit your own profile.")}`);
  }

  // The doctor scheduling fields only ever get read/written for the caller's
  // own doctor_profiles row (looked up by profile_id = session.userId, never
  // trusted from the client), matching the personal-fields check above.
  const isDoctor = formData.get("is_doctor") === "1" && session.isAdmin;

  let avatarUrl: string | undefined;
  if (avatarFile && avatarFile.size > 0) {
    if (avatarFile.size > 5 * 1024 * 1024) {
      redirect(`/dashboard/profiles?error=${encodeURIComponent("Profile photo is too large (max 5MB).")}`);
    }
    const ext = avatarFile.name.split(".").pop() || "jpg";
    const path = `${session.practiceId}/${memberId}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
    if (uploadError) {
      redirect(`/dashboard/profiles?error=${encodeURIComponent(`Photo upload failed: ${uploadError.message}`)}`);
    }
    avatarUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  }

  const { error: profileUpdateError } = await supabase
    .from("profiles")
    .update({
      full_name: fullName || null,
      phone: phone || null,
      bio: bio || null,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    })
    .eq("id", memberId);
  if (profileUpdateError) {
    redirect(`/dashboard/profiles?error=${encodeURIComponent(`Could not save your profile: ${profileUpdateError.message}`)}`);
  }

  if (isDoctor) {
    const { data: doctorProfile } = await supabase.from("doctor_profiles").select("id").eq("profile_id", session.userId).single();
    if (doctorProfile) {
      const blocks: HourBlock[] = JSON.parse(String(formData.get("blocks") || "[]"));
      const appointmentTypeId = String(formData.get("appointment_type_id") || "");
      const conditionsTreated = String(formData.get("conditions_treated") || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const { error: doctorUpdateError } = await supabase
        .from("doctor_profiles")
        .update({
          public_enabled: formData.get("public_enabled") === "on",
          specialty: String(formData.get("specialty") || "").trim() || null,
          credentials: String(formData.get("credentials") || "").trim() || null,
          conditions_treated: conditionsTreated,
          insurance_accepted: formData.getAll("insurance_accepted").map(String),
          languages: formData.getAll("languages").map(String),
          accepting_new_patients: formData.get("accepting_new_patients") === "on",
          telehealth_available: formData.get("telehealth_available") === "on",
          city: String(formData.get("city") || "").trim() || null,
          state: String(formData.get("state") || "").trim() || null,
          zip: String(formData.get("zip") || "").trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", doctorProfile.id);
      if (doctorUpdateError) {
        redirect(`/dashboard/profiles?error=${encodeURIComponent(`Could not save your schedule: ${doctorUpdateError.message}`)}`);
      }

      // Zero selected days means "leave working hours as they are" rather than
      // "clear them" -- a doctor should still be able to save their name,
      // photo, or other fields without being forced to touch their schedule.
      if (blocks.length > 0) {
        const { error: deleteError } = await supabase.from("doctor_availability").delete().eq("doctor_profile_id", doctorProfile.id);
        if (deleteError) {
          redirect(`/dashboard/profiles?error=${encodeURIComponent(`Could not save your working hours: ${deleteError.message}`)}`);
        }
        const { error: insertError } = await supabase.from("doctor_availability").insert(
          blocks.map((b) => ({
            practice_id: session.practiceId,
            doctor_profile_id: doctorProfile.id,
            weekday: b.weekday,
            start_time: b.start_time,
            end_time: b.end_time,
          }))
        );
        if (insertError) {
          redirect(`/dashboard/profiles?error=${encodeURIComponent(`Could not save your working hours: ${insertError.message}`)}`);
        }
      }

      if (appointmentTypeId) {
        await supabase
          .from("appointment_types")
          .update({
            duration_minutes: Number(formData.get("duration_minutes") || 30),
            is_telehealth: formData.get("telehealth_available") === "on",
          })
          .eq("id", appointmentTypeId);
      }
    }
  }

  revalidatePath("/dashboard/profiles");
  revalidatePath("/dashboard/chat");
}

export async function addBlackoutDateAction(formData: FormData) {
  const session = await getSessionProfile();
  const supabase = await createClient();
  const doctorProfileId = String(formData.get("doctor_profile_id") || "");

  const { data: doctorProfile } = await supabase.from("doctor_profiles").select("profile_id").eq("id", doctorProfileId).single();
  if (!doctorProfile || doctorProfile.profile_id !== session.userId) {
    redirect(`/dashboard/profiles?error=${encodeURIComponent("You can only edit your own schedule.")}`);
  }

  await supabase.from("blackout_dates").insert({
    practice_id: session.practiceId,
    doctor_profile_id: doctorProfileId,
    date: String(formData.get("date") || ""),
    reason: String(formData.get("reason") || "").trim() || null,
  });

  revalidatePath("/dashboard/profiles");
}

export async function deleteBlackoutDateAction(formData: FormData) {
  const session = await getSessionProfile();
  const supabase = await createClient();
  const doctorProfileId = String(formData.get("doctor_profile_id") || "");

  const { data: doctorProfile } = await supabase.from("doctor_profiles").select("profile_id").eq("id", doctorProfileId).single();
  if (!doctorProfile || doctorProfile.profile_id !== session.userId) {
    redirect(`/dashboard/profiles?error=${encodeURIComponent("You can only edit your own schedule.")}`);
  }

  await supabase.from("blackout_dates").delete().eq("id", String(formData.get("id") || "")).eq("doctor_profile_id", doctorProfileId);

  revalidatePath("/dashboard/profiles");
}
