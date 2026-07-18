"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";

function str(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) || "").trim();
  return v || null;
}

export async function savePatientProfileAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const hasSecondary = formData.get("has_secondary_insurance") === "on";

  let avatarUrl: string | undefined;
  const avatarFile = formData.get("avatar") as File | null;
  if (avatarFile && avatarFile.size > 0) {
    if (avatarFile.size > 5 * 1024 * 1024) {
      redirect("/patient/profile?edit=1&error=Profile+picture+must+be+under+5MB.");
    }
    const ext = avatarFile.name.split(".").pop() || "jpg";
    const path = `patients/${user.id}-${Date.now()}.${ext}`;
    // Session client, not admin -- storage RLS (0049) already scopes this
    // path to the caller's own auth.uid(), same pattern staff avatar
    // uploads use for their own practice-scoped folder.
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
    if (uploadError) {
      redirect(`/patient/profile?edit=1&error=${encodeURIComponent(uploadError.message)}`);
    }
    avatarUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  }

  const admin = await createAdminClient();

  const { error: accountError } = await admin
    .from("patient_accounts")
    .update({
      first_name: str(formData, "first_name") || undefined,
      last_name: str(formData, "last_name") || undefined,
      dob: str(formData, "dob") || undefined,
      mobile_phone: str(formData, "mobile_phone") || undefined,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    })
    .eq("id", user.id);

  if (accountError) {
    redirect(`/patient/profile?edit=1&error=${encodeURIComponent(accountError.message)}`);
  }

  const { error } = await admin.from("patient_profiles").upsert({
    patient_account_id: user.id,
    address: str(formData, "address"),
    city: str(formData, "city"),
    state: str(formData, "state"),
    zip: str(formData, "zip"),
    preferred_language: str(formData, "preferred_language"),
    preferred_contact_method: str(formData, "preferred_contact_method"),
    emergency_contact_name: str(formData, "emergency_contact_name"),
    emergency_contact_phone: str(formData, "emergency_contact_phone"),
    emergency_contact_relationship: str(formData, "emergency_contact_relationship"),
    insurance_company: str(formData, "insurance_company"),
    plan_type: str(formData, "plan_type"),
    member_id: str(formData, "member_id"),
    group_number: str(formData, "group_number"),
    plan_name: str(formData, "plan_name"),
    has_secondary_insurance: hasSecondary,
    secondary_insurance_company: hasSecondary ? str(formData, "secondary_insurance_company") : null,
    secondary_member_id: hasSecondary ? str(formData, "secondary_member_id") : null,
    secondary_group_number: hasSecondary ? str(formData, "secondary_group_number") : null,
    known_drug_allergies: str(formData, "known_drug_allergies"),
    current_medications: str(formData, "current_medications"),
    medical_history: str(formData, "medical_history"),
  });

  if (error) {
    redirect(`/patient/profile?edit=1&error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/patient/profile");
  redirect("/patient/profile?saved=1");
}
