import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export interface BlogIdentity {
  userId: string;
  authorType: "staff" | "patient";
  authorId: string | null;
  patientAuthorId: string | null;
  displayName: string;
  isSuperAdmin: boolean;
}

// Blog authorship spans two structurally different identities (practice
// staff via `profiles`, patient accounts via `patient_accounts` -- see
// 0039_patient_accounts.sql), neither of which can be assumed present for
// a given signed-in user. getSessionProfile() (lib/permissions.ts) isn't
// usable here since it redirects to /onboarding for a patient (no
// practice_id) rather than telling us they're a patient.
export async function requireBlogIdentity(nextPath: string): Promise<BlogIdentity> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`);

  const { data: profile } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).maybeSingle();
  if (profile) {
    return {
      userId: user.id,
      authorType: "staff",
      authorId: user.id,
      patientAuthorId: null,
      displayName: profile.full_name || "Staff",
      isSuperAdmin: profile.role === "super_admin",
    };
  }

  const { data: patient } = await supabase
    .from("patient_accounts")
    .select("first_name, last_name")
    .eq("id", user.id)
    .maybeSingle();
  if (patient) {
    return {
      userId: user.id,
      authorType: "patient",
      authorId: null,
      patientAuthorId: user.id,
      displayName: `${patient.first_name} ${patient.last_name}`,
      isSuperAdmin: false,
    };
  }

  redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`);
}

export interface PublicIdentity {
  displayName: string;
  avatarUrl: string | null;
}

// Likes/comments show the author's name + avatar to everyone, including
// visitors who aren't signed in as that person -- profiles/patient_accounts
// RLS only allows reading your own row, so this narrow lookup runs with the
// service-role client rather than exposing a broader read policy on either
// table just for this.
export async function getPublicIdentities(userIds: string[]): Promise<Record<string, PublicIdentity>> {
  const uniqueIds = Array.from(new Set(userIds));
  if (uniqueIds.length === 0) return {};

  const admin = await createAdminClient();
  const [{ data: staff }, { data: patients }] = await Promise.all([
    admin.from("profiles").select("id, full_name, avatar_url").in("id", uniqueIds),
    admin.from("patient_accounts").select("id, first_name, last_name").in("id", uniqueIds),
  ]);

  const result: Record<string, PublicIdentity> = {};
  for (const row of staff || []) {
    result[row.id] = { displayName: row.full_name || "Staff", avatarUrl: row.avatar_url };
  }
  for (const row of patients || []) {
    result[row.id] = { displayName: `${row.first_name} ${row.last_name}`, avatarUrl: null };
  }
  return result;
}
