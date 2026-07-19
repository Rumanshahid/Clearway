"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import type { UserRole } from "@/lib/database.types";

const VALID_ROLES = ["clinic_admin", "clinic_user"];
const VALID_SECTIONS = ["requests", "patients", "appeals"];

// Build our own confirmation URL from generateLink()'s hashed_token +
// verification_type, instead of using its action_link (which points
// straight at Supabase's hosted /auth/v1/verify — a one-time-use token that
// a GET request consumes with no user interaction required). Link-preview
// crawlers (WhatsApp, Telegram, corporate email "Safe Links" scanners) fetch
// URLs to build previews, silently burning that token before the real
// recipient ever taps it. /auth/confirm renders a button and only verifies
// on an explicit click, so a crawler's inert page load doesn't consume it.
function confirmUrlFrom(
  siteUrl: string,
  linkData: { properties: { hashed_token: string; verification_type: string } | null } | null,
  next: string
): string | null {
  const props = linkData?.properties;
  if (!props?.hashed_token) return null;
  return `${siteUrl}/auth/confirm?token_hash=${encodeURIComponent(props.hashed_token)}&type=${encodeURIComponent(props.verification_type)}&next=${encodeURIComponent(next)}`;
}

// Every action here re-verifies the caller server-side — the Team page being
// admin-only in the UI is not enforcement, and several of these writes go
// through the service-role client (RLS lets a user update only their own
// profile row, and the 0015 trigger deliberately blocks role/practice
// changes from the regular client), so the check must happen before that.
async function requireCallerIsPracticeAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("practice_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.practice_id || (profile.role !== "clinic_admin" && profile.role !== "super_admin")) {
    redirect("/doctor/dashboard");
  }

  return { callerId: user.id, practiceId: profile.practice_id };
}

function readSections(formData: FormData): string[] {
  const picked = formData.getAll("sections").map(String).filter((s) => VALID_SECTIONS.includes(s));
  return picked.length > 0 ? picked : VALID_SECTIONS;
}

export async function inviteMemberAction(formData: FormData) {
  const { callerId, practiceId } = await requireCallerIsPracticeAdmin();

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const role = String(formData.get("role") || "clinic_user");
  const title = String(formData.get("title") || "").trim();
  const sections = readSections(formData);

  if (!email || !email.includes("@")) {
    redirect(`/dashboard/team?error=${encodeURIComponent("A valid email address is required.")}`);
  }
  if (!VALID_ROLES.includes(role)) {
    redirect(`/dashboard/team?error=${encodeURIComponent("Pick a valid role.")}`);
  }

  const supabase = await createClient();
  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { error } = await supabase.from("invites").insert({
    practice_id: practiceId,
    email,
    role,
    title: title || null,
    allowed_sections: role === "clinic_admin" ? VALID_SECTIONS : sections,
    token,
    created_by: callerId,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    redirect(`/dashboard/team?error=${encodeURIComponent(error.message)}`);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.asaanbil.com";
  const joinUrl = `${siteUrl}/join/${token}`;
  const roleLabel = title || (role === "clinic_admin" ? "a Doctor / Admin" : "Staff");

  // Passwordless: generate a Supabase auth link (invite for a brand-new
  // email, magiclink if this email already has an account elsewhere) that
  // signs them in directly, redirected straight to /join/[token] where they
  // auto-attach to this practice. No "create a password" step for staff —
  // clicking the link is the entire signup. Falls back to a plain link to
  // /sign-up (normal password signup) if link generation fails for any
  // reason, so an invite is never silently lost.
  const admin = await createAdminClient();
  const redirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent(`/join/${token}`)}`;

  const { data: existingUsers } = await admin.auth.admin.listUsers({ perPage: 200 });
  const userExists = (existingUsers?.users || []).some((u) => u.email?.toLowerCase() === email);

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: userExists ? "magiclink" : "invite",
    email,
    options: { redirectTo },
  });

  const actionLink = confirmUrlFrom(siteUrl, linkData, `/join/${token}`);
  if (linkError) console.error("generateLink failed, falling back to manual sign-up link", linkError);

  // Deliberately no bare "asaanbil.com"-style text anywhere in this body —
  // several mail clients (Gmail included) auto-linkify plain domain-looking
  // text, and a staff member clicking that instead of the real button below
  // just lands on the marketing homepage with nothing else happening.
  const buttonHtml = (href: string, label: string) =>
    `<p style="margin:24px 0;"><a href="${href}" style="display:inline-block;background:#4F46E5;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">${label}</a></p>`;

  try {
    await sendEmail({
      to: email,
      subject: "You've been invited to join your practice's workspace",
      html: actionLink
        ? `<p>You've been invited to join your practice's workspace as ${roleLabel}.</p><p>Click the button below to get started — you'll be signed in and added to the practice automatically, no password needed:</p>${buttonHtml(actionLink, "Join your practice →")}<p>This invite expires in 7 days.</p>`
        : `<p>You've been invited to join your practice's workspace as ${roleLabel}.</p><p>Click the button below to get started — it'll walk you through creating an account and add you automatically once you confirm your email:</p>${buttonHtml(joinUrl, "Join your practice →")}<p>This invite expires in 7 days.</p>`,
    });
  } catch (err) {
    console.error("invite email failed", err);
  }

  revalidatePath("/dashboard/team");
  redirect(`/dashboard/team?invited=${encodeURIComponent(email)}`);
}

// Powers the "Copy link" button for a pending invite. The email an invite
// sends already contains a passwordless Supabase link, but that link isn't
// stored anywhere — it only exists in the outgoing email. So "Copy link" used
// to fall back to the plain /join/[token] URL, which forces whoever opens it
// through a manual create-account flow if they aren't already signed in.
// Generating a fresh passwordless link here on demand gives "Copy link" the
// exact same click-and-join experience as the email.
export async function generateInviteLinkAction(inviteId: string): Promise<{ link?: string; error?: string }> {
  const { practiceId } = await requireCallerIsPracticeAdmin();

  const admin = await createAdminClient();
  const { data: invite } = await admin
    .from("invites")
    .select("token, email, practice_id, accepted_at, expires_at")
    .eq("id", inviteId)
    .single();

  if (!invite || invite.practice_id !== practiceId) {
    return { error: "Invite not found." };
  }
  if (invite.accepted_at || new Date(invite.expires_at) < new Date()) {
    return { error: "This invite has expired or was already used." };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.asaanbil.com";
  const redirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent(`/join/${invite.token}`)}`;

  // Re-check every time: the first "invite"-type link already creates the
  // (unconfirmed) auth user, so a second click for the same invite must
  // switch to "magiclink" or generateLink errors with "user already exists".
  const { data: existingUsers } = await admin.auth.admin.listUsers({ perPage: 200 });
  const userExists = (existingUsers?.users || []).some((u) => u.email?.toLowerCase() === invite.email);

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: userExists ? "magiclink" : "invite",
    email: invite.email,
    options: { redirectTo },
  });

  const link = confirmUrlFrom(siteUrl, linkData, `/join/${invite.token}`);
  if (linkError || !link) {
    return { error: "Couldn't generate a link right now — try again in a moment." };
  }

  return { link };
}

export async function revokeInviteAction(formData: FormData) {
  await requireCallerIsPracticeAdmin();
  const inviteId = String(formData.get("invite_id") || "");

  const supabase = await createClient();
  await supabase.from("invites").delete().eq("id", inviteId);

  revalidatePath("/dashboard/team");
}

export async function updateMemberAction(formData: FormData) {
  const { callerId, practiceId } = await requireCallerIsPracticeAdmin();

  const memberId = String(formData.get("member_id") || "");
  const role = String(formData.get("role") || "clinic_user");
  const title = String(formData.get("title") || "").trim();
  const sections = readSections(formData);

  if (memberId === callerId) {
    redirect(`/dashboard/team?error=${encodeURIComponent("You can't change your own role — ask another admin.")}`);
  }
  if (!VALID_ROLES.includes(role)) {
    redirect(`/dashboard/team?error=${encodeURIComponent("Pick a valid role.")}`);
  }

  const admin = await createAdminClient();
  const { data: member } = await admin.from("profiles").select("practice_id").eq("id", memberId).single();
  if (!member || member.practice_id !== practiceId) {
    redirect(`/dashboard/team?error=${encodeURIComponent("That person isn't a member of your practice.")}`);
  }

  await admin
    .from("profiles")
    .update({
      role: role as UserRole,
      title: title || null,
      allowed_sections: role === "clinic_admin" ? VALID_SECTIONS : sections,
    })
    .eq("id", memberId);

  revalidatePath("/dashboard/team");
  redirect("/dashboard/team");
}

export async function removeMemberAction(formData: FormData) {
  const { callerId, practiceId } = await requireCallerIsPracticeAdmin();
  const memberId = String(formData.get("member_id") || "");

  if (memberId === callerId) {
    redirect(`/dashboard/team?error=${encodeURIComponent("You can't remove yourself.")}`);
  }

  const admin = await createAdminClient();
  const { data: member } = await admin.from("profiles").select("practice_id").eq("id", memberId).single();
  if (!member || member.practice_id !== practiceId) {
    redirect(`/dashboard/team?error=${encodeURIComponent("That person isn't a member of your practice.")}`);
  }

  // Detach, don't delete: their account survives, but loses all access to
  // this practice's data the moment practice_id is null (every RLS policy
  // keys off it). Their past work (requests, letters) stays with the
  // practice, attributed to created_by as before.
  await admin
    .from("profiles")
    .update({ practice_id: null, role: "clinic_user", allowed_sections: VALID_SECTIONS })
    .eq("id", memberId);

  revalidatePath("/dashboard/team");
  redirect("/dashboard/team");
}
