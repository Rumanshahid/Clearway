"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/database.types";

export async function changeRoleAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const role = String(formData.get("role") || "") as UserRole;

  const supabase = await createClient();
  await supabase.from("profiles").update({ role }).eq("id", id);
  revalidatePath("/admin/users");
}

export async function toggleFlagAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const flagged = String(formData.get("flagged") || "") !== "true";
  const reason = flagged ? String(formData.get("reason") || "Flagged by admin") : null;

  const supabase = await createClient();
  await supabase.from("profiles").update({ flagged, flagged_reason: reason }).eq("id", id);
  revalidatePath("/admin/users");
}

export async function sendPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") || "");
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback?next=/reset-password`,
  });
  revalidatePath("/admin/users");
}

export async function getUsersWithProfiles(query?: string) {
  const admin = await createAdminClient();
  const supabase = await createClient();

  const { data: authList } = await admin.auth.admin.listUsers({ perPage: 200 });
  const { data: profiles } = await supabase.from("profiles").select("*");
  const { data: practices } = await supabase.from("practices").select("id, name");

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
  const practiceNameById = new Map((practices || []).map((p) => [p.id, p.name]));

  let rows = (authList?.users || []).map((u) => {
    const profile = profileMap.get(u.id);
    return {
      id: u.id,
      email: u.email || "",
      fullName: profile?.full_name || "",
      role: (profile?.role || "clinic_user") as UserRole,
      flagged: profile?.flagged || false,
      practiceName: (profile?.practice_id && practiceNameById.get(profile.practice_id)) || "",
      createdAt: u.created_at,
    };
  });

  if (query) {
    const q = query.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.email.toLowerCase().includes(q) ||
        r.fullName.toLowerCase().includes(q) ||
        r.practiceName.toLowerCase().includes(q)
    );
  }

  return rows;
}
