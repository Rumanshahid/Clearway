import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/database.types";
import { DASHBOARD_SECTIONS, type SectionKey } from "@/lib/sections";

// Dashboard sections a staff member (clinic_user) can be granted live in
// lib/sections.ts (client-safe). Admins (clinic_admin — the "Doctor /
// Admin" role — and super_admin) always see everything; allowed_sections
// only restricts clinic_user profiles.
export { DASHBOARD_SECTIONS, type SectionKey };

export interface SessionProfile {
  userId: string;
  practiceId: string;
  role: UserRole;
  allowedSections: string[];
  isAdmin: boolean;
}

export async function getSessionProfile(): Promise<SessionProfile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("practice_id, role, allowed_sections")
    .eq("id", user.id)
    .single();

  if (!profile?.practice_id) redirect("/onboarding");

  const role = profile.role as UserRole;
  return {
    userId: user.id,
    practiceId: profile.practice_id,
    role,
    allowedSections: profile.allowed_sections || [],
    isAdmin: role === "clinic_admin" || role === "super_admin",
  };
}

export function canAccessSection(profile: SessionProfile, section: SectionKey): boolean {
  return profile.isAdmin || profile.allowedSections.includes(section);
}

// Where to send someone who lands on a section they can't open — their
// first permitted section, or Resources if an admin granted them nothing.
export function firstAllowedPath(profile: SessionProfile): string {
  for (const section of DASHBOARD_SECTIONS) {
    if (canAccessSection(profile, section.key)) return section.href;
  }
  return "/dashboard/resources";
}

// Page/action guard. Used both by section pages (server components) and the
// create actions behind them — nav hiding alone isn't enforcement, since a
// staff member could still type the URL or POST the action directly.
export async function requireSectionAccess(section: SectionKey): Promise<SessionProfile> {
  const profile = await getSessionProfile();
  if (!canAccessSection(profile, section)) {
    redirect(firstAllowedPath(profile));
  }
  return profile;
}

export async function requireAdmin(): Promise<SessionProfile> {
  const profile = await getSessionProfile();
  if (!profile.isAdmin) {
    redirect(firstAllowedPath(profile));
  }
  return profile;
}
