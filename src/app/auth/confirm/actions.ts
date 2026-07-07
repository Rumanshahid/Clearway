"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function confirmInviteLinkAction(formData: FormData) {
  const tokenHash = String(formData.get("token_hash") || "");
  const type = String(formData.get("type") || "") as EmailOtpType;
  const next = String(formData.get("next") || "/dashboard");

  if (!tokenHash || !type) {
    redirect(`/sign-in?error=${encodeURIComponent("That link is missing required information. Ask for a new one.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

  if (error) {
    redirect(`/sign-in?error=${encodeURIComponent("That link is invalid, expired, or was already used. Ask for a new one.")}`);
  }

  redirect(next);
}
