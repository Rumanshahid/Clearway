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

  const admin = await createAdminClient();
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
    redirect(`/patient/profile?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/patient/profile");
  redirect("/patient/profile?saved=1");
}
