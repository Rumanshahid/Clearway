"use server";

import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/database.types";

export async function acceptInviteAction(formData: FormData) {
  const token = String(formData.get("token") || "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/join/${token}`);

  // The invitee isn't a practice member yet, so RLS can't show them the
  // invite — the service-role client does the lookup, gated on the token
  // itself being the secret.
  const admin = await createAdminClient();
  const { data: invite } = await admin.from("invites").select("*").eq("token", token).single();

  if (!invite || invite.accepted_at || new Date(invite.expires_at) < new Date()) {
    redirect(`/join/${token}?error=${encodeURIComponent("This invite is no longer valid — ask your practice admin for a new one.")}`);
    return;
  }

  const { data: profile } = await admin.from("profiles").select("practice_id").eq("id", user.id).single();
  if (profile?.practice_id) {
    redirect(`/join/${token}?error=${encodeURIComponent("This account already belongs to a practice.")}`);
    return;
  }

  // Role/practice changes are deliberately blocked from the regular client
  // (0015's trigger) — attaching an invitee is one of the two legitimate
  // service-role paths, alongside onboarding's practice creation.
  const { error: updateError } = await admin
    .from("profiles")
    .update({
      practice_id: invite.practice_id,
      role: invite.role as UserRole,
      allowed_sections: invite.allowed_sections,
    })
    .eq("id", user.id);

  if (updateError) {
    redirect(`/join/${token}?error=${encodeURIComponent(updateError.message)}`);
    return;
  }

  await admin
    .from("invites")
    .update({ accepted_at: new Date().toISOString(), accepted_by: user.id })
    .eq("id", invite.id);

  redirect("/dashboard");
}
