"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PracticePlan } from "@/lib/database.types";
import { PILOT_LETTERS_INCLUDED } from "@/lib/billing";

export async function completeOnboardingAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const name = String(formData.get("name") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const npi = String(formData.get("npi") || "").trim();
  const specialty = String(formData.get("specialty") || "").trim();
  const primaryPayers = formData.getAll("primary_payers").map(String);
  const staffCount = Number(formData.get("staff_count") || 1);
  const plan = String(formData.get("plan") || "pilot") as PracticePlan;
  const baaAccepted = formData.get("baa_accepted") === "on";

  if (!name) {
    redirect(`/onboarding?error=${encodeURIComponent("Practice name is required.")}`);
  }

  if (!baaAccepted) {
    redirect(`/onboarding?error=${encodeURIComponent("You must accept the Business Associate Agreement to continue.")}`);
  }

  const { data: practice, error: practiceError } = await supabase
    .from("practices")
    .insert({
      name,
      address: address || null,
      npi: npi || null,
      specialty: specialty || null,
      primary_payers: primaryPayers,
      staff_count: staffCount,
      plan,
      letters_included: plan === "pilot" ? PILOT_LETTERS_INCLUDED : 999_999,
      baa_accepted_at: new Date().toISOString(),
      baa_accepted_by: user.id,
    })
    .select("id")
    .single();

  if (practiceError || !practice) {
    redirect(`/onboarding?error=${encodeURIComponent(practiceError?.message || "Could not create practice.")}`);
    return;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ practice_id: practice.id, role: "clinic_admin" })
    .eq("id", user.id);

  if (profileError) {
    redirect(`/onboarding?error=${encodeURIComponent(profileError.message)}`);
  }

  redirect("/dashboard");
}
