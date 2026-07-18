"use server";

import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function createPatientAccountAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const first_name = String(formData.get("first_name") || "").trim();
  const last_name = String(formData.get("last_name") || "").trim();
  const dob = String(formData.get("dob") || "").trim();
  const mobile_phone = String(formData.get("mobile_phone") || "").trim();

  const consent_share_info = formData.get("consent_share_info") === "on";
  const consent_terms_privacy = formData.get("consent_terms_privacy") === "on";
  const consent_notifications = formData.get("consent_notifications") === "on";

  if (
    !first_name ||
    !last_name ||
    !dob ||
    !mobile_phone ||
    !consent_share_info ||
    !consent_terms_privacy ||
    !consent_notifications
  ) {
    redirect("/auth/choose-role/patient?error=Please+complete+every+field+and+consent+checkbox.");
  }

  const admin = await createAdminClient();
  const { error } = await admin.from("patient_accounts").insert({
    id: user.id,
    first_name,
    last_name,
    dob,
    mobile_phone,
    email: user.email || "",
    consent_share_info,
    consent_terms_privacy,
    consent_notifications,
  });

  if (error) {
    redirect(`/auth/choose-role/patient?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/patient/welcome");
}
