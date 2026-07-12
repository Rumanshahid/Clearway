import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { getSessionProfile } from "@/lib/permissions";
import { getGmailAuthUrl } from "@/lib/gmail";

export const runtime = "nodejs";

// Kicks off the OAuth flow -- only a doctor connecting their own inbox
// should land here (linked from their own Profile page), so this just needs
// a signed-in session, not a specific doctor_profile_id in the URL.
export async function GET() {
  await getSessionProfile();

  const state = randomUUID();
  const cookieStore = await cookies();
  cookieStore.set("gmail_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return NextResponse.redirect(getGmailAuthUrl(state));
}
