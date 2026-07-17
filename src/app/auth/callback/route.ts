import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { resolvePostLoginPath } from "@/lib/auth-redirect";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  // No default here (unlike before) -- an explicit `next` (email
  // confirmation, invite links) always wins, but a bare OAuth sign-in
  // (Google/Microsoft, no `next` set by signInWithOAuthAction) should land
  // on the same role-aware destination password sign-in resolves to, not
  // an unconditional /dashboard that ignores patient/doctor/staff routing.
  const explicitNext = searchParams.get("next");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  const supabase = await createClient();

  async function destination() {
    if (explicitNext) return explicitNext;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ? resolvePostLoginPath(supabase, user.id) : "/dashboard";
  }

  // Preferred path: token_hash + type (from a custom email template link).
  // Doesn't depend on the browser/device that opened the link matching the
  // one that started signup, unlike PKCE code exchange below.
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      return NextResponse.redirect(`${origin}${await destination()}`);
    }
  }

  // Fallback path: PKCE code exchange (default Supabase confirmation link,
  // or an OAuth provider redirect). Only works if opened in the same
  // browser session that initiated the request.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${await destination()}`);
    }
  }

  // Neither query-param path matched. Admin-generated links (invite /
  // magiclink, from generateLink()) have no preceding client-side PKCE
  // step, so Supabase delivers their session as a URL fragment
  // (#access_token=...) instead — fragments never reach the server, only
  // the browser. Hand off to a client page that can read location.hash.
  // No fragment is set on this redirect, so browsers carry over whatever
  // fragment the original URL had.
  return NextResponse.redirect(`${origin}/auth/hash-callback?next=${encodeURIComponent(explicitNext || "/dashboard")}`);
}
