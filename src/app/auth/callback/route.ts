import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/dashboard";
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  const supabase = await createClient();

  // Preferred path: token_hash + type (from a custom email template link).
  // Doesn't depend on the browser/device that opened the link matching the
  // one that started signup, unlike PKCE code exchange below.
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Fallback path: PKCE code exchange (default Supabase confirmation link,
  // or an OAuth provider redirect). Only works if opened in the same
  // browser session that initiated the request.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/sign-in?error=${encodeURIComponent(
      "That link is invalid, expired, or was opened in a different browser than the one you signed up in. Try signing in directly, or request a new link."
    )}`
  );
}
