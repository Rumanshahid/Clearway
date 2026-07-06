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

  // Neither query-param path matched. Admin-generated links (invite /
  // magiclink, from generateLink()) have no preceding client-side PKCE
  // step, so Supabase delivers their session as a URL fragment
  // (#access_token=...) instead — fragments never reach the server, only
  // the browser. Hand off to a client page that can read location.hash.
  // No fragment is set on this redirect, so browsers carry over whatever
  // fragment the original URL had.
  return NextResponse.redirect(`${origin}/auth/hash-callback?next=${encodeURIComponent(next)}`);
}
