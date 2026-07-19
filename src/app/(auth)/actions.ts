"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { resolvePostLoginPath } from "@/lib/auth-redirect";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

// The PKCE code_verifier cookie signInWithOAuth() sets is scoped to
// whichever host actually served this request -- asaanbil.com and
// www.asaanbil.com are both valid domains on this site but don't share
// cookies, so an OAuth redirectTo must come back to that *same* host or
// the callback fails with "PKCE code verifier not found in storage". Using
// the actual request's Host header (rather than a fixed NEXT_PUBLIC_SITE_URL)
// guarantees that, regardless of which domain the visitor is on.
async function requestOrigin() {
  const h = await headers();
  const host = h.get("host");
  return host ? `https://${host}` : siteUrl();
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

  redirect(await resolvePostLoginPath(data.user.id));
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
      redirectTo: `${await requestOrigin()}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`,
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

  redirect("/doctor/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // Belt-and-suspenders: every page that reads the session (SiteNav,
  // dashboard layout) is already dynamically rendered because it
  // calls cookies(), so this shouldn't be needed for correctness -- but it
  // guarantees no cached RSC payload from the still-signed-in render can
  // ever be served after sign-out.
  revalidatePath("/", "layout");
  redirect("/sign-in");
}
