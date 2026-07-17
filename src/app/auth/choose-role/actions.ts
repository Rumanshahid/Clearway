"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// Completes a patient identity for someone who signed in via Google/
// Microsoft and picked "Patient" on /auth/choose-role. Their auth.users
// row and (empty, unused) profiles row already exist from the OAuth
// sign-in trigger -- this deletes that leftover staff-shaped profile and
// creates the real patient_accounts row, mirroring patientSignUpAction's
// consent/ref-id/welcome-cookie flow so the experience matches password
// signup exactly from here on.
export async function completeOAuthPatientAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  function fail(message: string): never {
    redirect(`/auth/choose-role/patient?error=${encodeURIComponent(message)}`);
  }

  const firstName = String(formData.get("first_name") || "").trim();
  const lastName = String(formData.get("last_name") || "").trim();
  const dob = String(formData.get("dob") || "").trim();
  const mobilePhone = String(formData.get("mobile_phone") || "").trim();
  const consentShare = formData.get("consent_share") === "on";
  const consentTerms = formData.get("consent_terms") === "on";
  const consentNotifications = formData.get("consent_notifications") === "on";

  if (!firstName || !lastName || !dob || !mobilePhone) fail("First name, last name, date of birth, and mobile phone are all required.");
  if (!consentShare || !consentTerms) fail("Both consent checkboxes are required to create an account.");

  const admin = await createAdminClient();

  // Leftover from the auth trigger's default "staff" assumption -- has no
  // practice_id, nothing else references it yet, safe to remove now that
  // we know this person is actually a patient.
  await admin.from("profiles").delete().eq("id", user.id);

  const { data: account, error: insertError } = await admin
    .from("patient_accounts")
    .insert({
      id: user.id,
      first_name: firstName,
      last_name: lastName,
      dob,
      mobile_phone: mobilePhone,
      email: user.email || "",
      consent_share_info: consentShare,
      consent_terms_privacy: consentTerms,
      consent_notifications: consentNotifications,
    })
    .select("patient_ref_id")
    .single();

  if (insertError || !account) {
    fail("Couldn't finish setting up your patient account. Contact hello@asaanbil.com.");
  }

  const cookieStore = await cookies();
  cookieStore.set("patient_signup_ref", account.patient_ref_id, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/patient",
  });
  cookieStore.set("patient_signup_name", firstName, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/patient",
  });

  redirect("/patient/welcome");
}
