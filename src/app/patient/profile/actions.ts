"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updatePatientProfileAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const field = (name: string) => String(formData.get(name) || "").trim() || null;
  const hasSecondary = formData.get("has_secondary_insurance") === "on";

  await supabase.from("patient_profiles").upsert({
    patient_account_id: user.id,
    address: field("address"),
    city: field("city"),
    state: field("state"),
    zip: field("zip"),
    preferred_language: field("preferred_language"),
    emergency_contact_name: field("emergency_contact_name"),
    emergency_contact_phone: field("emergency_contact_phone"),
    emergency_contact_relationship: field("emergency_contact_relationship"),
    insurance_company: field("insurance_company"),
    plan_type: field("plan_type"),
    member_id: field("member_id"),
    group_number: field("group_number"),
    plan_name: field("plan_name"),
    has_secondary_insurance: hasSecondary,
    secondary_insurance_company: hasSecondary ? field("secondary_insurance_company") : null,
    secondary_member_id: hasSecondary ? field("secondary_member_id") : null,
    secondary_group_number: hasSecondary ? field("secondary_group_number") : null,
    known_drug_allergies: field("known_drug_allergies"),
    current_medications: field("current_medications"),
    preferred_contact_method: field("preferred_contact_method"),
    updated_at: new Date().toISOString(),
  });

  redirect("/patient?saved=1");
}
