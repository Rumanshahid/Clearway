"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { resolvePostLoginPath } from "@/lib/auth-redirect";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("full_name") || "").trim();
  const invite = String(formData.get("invite") || "").trim();

  if (!email || !password || password.length < 8) {
    redirect(
      `/sign-up?error=${encodeURIComponent(
        "Enter a valid email and a password of at least 8 characters."
      )}${invite ? `&invite=${encodeURIComponent(invite)}` : ""}`
    );
  }

  const supabase = await createClient();
  // An invited signup skips onboarding entirely — confirming lands them on
  // /join/[token], which auto-accepts and attaches them to the inviting
  // practice instead of them ever seeing the "create a practice" form.
  const next = invite ? `/join/${invite}` : "/onboarding";
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
      data: { full_name: fullName },
    },
  });

  if (error) {
    redirect(
      `/sign-up?error=${encodeURIComponent(error.message)}${invite ? `&invite=${encodeURIComponent(invite)}` : ""}`
    );
  }

  redirect(`/check-email?email=${encodeURIComponent(email)}`);
}

// Patient self-signup -- a completely separate identity from practice
// staff (see migration 0039): no practice_id, no profiles row at all. All
// three steps of the signup wizard submit together here rather than
// per-step, so an abandoned partial signup never leaves a half-created
// account behind.
export async function patientSignUpAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirm_password") || "");
  const firstName = String(formData.get("first_name") || "").trim();
  const lastName = String(formData.get("last_name") || "").trim();
  const dob = String(formData.get("dob") || "").trim();
  const mobilePhone = String(formData.get("mobile_phone") || "").trim();
  const consentShare = formData.get("consent_share") === "on";
  const consentTerms = formData.get("consent_terms") === "on";
  const consentNotifications = formData.get("consent_notifications") === "on";

  function fail(message: string): never {
    redirect(`/sign-up?type=patient&error=${encodeURIComponent(message)}`);
  }

  if (!email || !password || password.length < 8) fail("Enter a valid email and a password of at least 8 characters.");
  if (password !== confirmPassword) fail("Passwords don't match.");
  if (!firstName || !lastName || !dob || !mobilePhone) fail("First name, last name, date of birth, and mobile phone are all required.");
  if (!consentShare || !consentTerms) fail("Both consent checkboxes are required to create an account.");

  const supabase = await createClient();
  const { data: signUpData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent("/patient")}`,
      data: { full_name: `${firstName} ${lastName}`, account_type: "patient" },
    },
  });

  if (error || !signUpData.user) {
    fail(error?.message || "Could not create your account.");
  }

  // The patient_accounts row is created with the service-role client, not
  // the caller's own (unconfirmed, not-yet-fully-authenticated) session --
  // same reason onboarding creates a practice row with the admin client
  // rather than trusting a direct insert from the signed-in user.
  const admin = await createAdminClient();
  const { data: account, error: insertError } = await admin
    .from("patient_accounts")
    .insert({
      id: signUpData.user.id,
      first_name: firstName,
      last_name: lastName,
      dob,
      mobile_phone: mobilePhone,
      email,
      consent_share_info: consentShare,
      consent_terms_privacy: consentTerms,
      consent_notifications: consentNotifications,
    })
    .select("patient_ref_id")
    .single();

  if (insertError || !account) {
    fail("Your login was created, but we couldn't finish setting up your patient account. Contact hello@asaanbil.com.");
  }

  // Passed via a short-lived httpOnly cookie, not a URL query param -- a
  // patient reference id tied to a real name shouldn't sit in a URL (logs,
  // browser history, referrer headers), and email confirmation is required
  // before a real session exists, so this is the only way to show the
  // welcome screen immediately without waiting for that click-through.
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

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "");

  const supabase = await createClient();
  const { error, data } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/sign-in?error=${encodeURIComponent(error.message)}`);
  }

  if (next) redirect(next);

  redirect(await resolvePostLoginPath(supabase, data.user.id));
}

// Google/Microsoft sign-in -- signInWithOAuth() returns a provider URL to
// send the browser to (it doesn't sign anyone in itself), so this is a
// Server Action purely to get a server-side redirect() to that URL. The
// provider then bounces back to /auth/callback, which exchanges the code
// for a session the same way the email-confirmation link flow already does.
export async function signInWithOAuthAction(formData: FormData) {
  const provider = String(formData.get("provider") || "");
  if (provider !== "google" && provider !== "azure") {
    redirect("/sign-in?error=Unsupported+sign-in+method");
  }

  const next = String(formData.get("next") || "");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${siteUrl()}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`,
    },
  });

  if (error || !data.url) {
    redirect(`/sign-in?error=${encodeURIComponent(error?.message || "Could not start sign-in.")}`);
  }

  redirect(data.url);
}

export async function forgotPasswordAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const supabase = await createClient();

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl()}/auth/callback?next=/reset-password`,
  });

  // Always show the same confirmation, regardless of whether the email exists.
  redirect(`/check-email?email=${encodeURIComponent(email)}&reset=1`);
}

export async function resetPasswordAction(formData: FormData) {
  const password = String(formData.get("password") || "");
  if (password.length < 8) {
    redirect(`/reset-password?error=${encodeURIComponent("Password must be at least 8 characters.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // Belt-and-suspenders: every page that reads the session (SiteNav,
  // dashboard/patient layouts) is already dynamically rendered because it
  // calls cookies(), so this shouldn't be needed for correctness -- but it
  // guarantees no cached RSC payload from the still-signed-in render can
  // ever be served after sign-out.
  revalidatePath("/", "layout");
  redirect("/sign-in");
}
