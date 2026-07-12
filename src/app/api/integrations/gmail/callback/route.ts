import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionProfile } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens, getGmailProfile } from "@/lib/gmail";

export const runtime = "nodejs";

function redirectToProfile(request: Request, error?: string) {
  const url = new URL("/dashboard/profiles", request.url);
  if (error) url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("gmail_oauth_state")?.value;
  cookieStore.delete("gmail_oauth_state");

  if (oauthError) {
    return redirectToProfile(request, oauthError === "access_denied" ? "Gmail connection cancelled." : `Gmail connection failed: ${oauthError}`);
  }
  if (!code || !state || state !== expectedState) {
    return redirectToProfile(request, "Gmail connection failed — the request could not be verified. Try again.");
  }

  const session = await getSessionProfile();
  const supabase = await createClient();

  const { data: doctorProfile } = await supabase
    .from("doctor_profiles")
    .select("id")
    .eq("profile_id", session.userId)
    .maybeSingle();
  if (!doctorProfile) {
    return redirectToProfile(request, "Only a doctor's own profile can connect an inbox.");
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const profile = await getGmailProfile(tokens.access_token);

    const { error } = await supabase.from("email_connections").upsert(
      {
        practice_id: session.practiceId,
        doctor_profile_id: doctorProfile.id,
        email_address: profile.emailAddress,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || "",
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      },
      { onConflict: "doctor_profile_id" }
    );
    if (error) throw error;

    // Google only returns a refresh_token on the very first consent for a
    // given account+scope combination -- if this doctor had connected before,
    // revoked, and is reconnecting, prompt=consent on the auth URL forces a
    // fresh one every time, so this should always be present in practice.
    if (!tokens.refresh_token) {
      return redirectToProfile(request, "Gmail connected, but no long-lived access was granted — disconnect and try again, making sure to approve all requested permissions.");
    }
  } catch (err) {
    console.error("Gmail OAuth callback failed", err);
    return redirectToProfile(request, "Could not finish connecting Gmail. Try again.");
  }

  return NextResponse.redirect(new URL("/dashboard/profiles?saved=1", request.url));
}
