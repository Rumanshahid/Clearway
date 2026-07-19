"use server";

import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { AuthoringMode, PracticePlan } from "@/lib/database.types";
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
  const defaultAuthoringMode = String(formData.get("default_authoring_mode") || "doctor") as AuthoringMode;
  const baaAccepted = formData.get("baa_accepted") === "on";

  if (!name) {
    redirect(`/onboarding?error=${encodeURIComponent("Practice name is required.")}`);
  }

  if (!baaAccepted) {
    redirect(`/onboarding?error=${encodeURIComponent("You must accept the Business Associate Agreement to continue.")}`);
  }

  // This one insert is a deliberate RLS bypass: creating-and-linking-yourself-to
  // a brand-new practice is a bootstrapping step that the normal per-practice
  // RLS policies can't express (your profile isn't linked to the practice
  // until the next step, so the standard SELECT policy can't see the row it
  // just inserted). `user` above is already verified as a real logged-in user.
  const admin = await createAdminClient();
  const { data: practice, error: practiceError } = await admin
    .from("practices")
    .insert({
      name,
      address: address || null,
      npi: npi || null,
      specialty: specialty || null,
      primary_payers: primaryPayers,
      staff_count: staffCount,
      plan,
      default_authoring_mode: defaultAuthoringMode,
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

  // profiles.role and .practice_id can only be changed via the service-role
  // client (see 0015_lock_profile_role_escalation.sql) — the regular client
  // would now silently no-op this update.
  const { error: profileError } = await admin
    .from("profiles")
    .update({ practice_id: practice.id, role: "clinic_admin" })
    .eq("id", user.id);

  if (profileError) {
    redirect(`/onboarding?error=${encodeURIComponent(profileError.message)}`);
  }

  redirect("/doctor/dashboard");
}
