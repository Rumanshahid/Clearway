import { createClient } from "@/lib/supabase/server";
import { ensureTeamConversation, ensureDirectConversations, getConversationSummaries } from "@/lib/chat";
import { getTaskPreview } from "@/lib/taskPreview";
import type { ConversationPreview } from "@/app/dashboard/ChatBell";
import type { TaskPreviewItem } from "@/app/dashboard/TasksBell";
import type { NotificationRow } from "@/app/dashboard/NotificationBell";

export interface DashboardNavData {
  isAdmin: boolean;
  sections: string[];
  userId: string;
  userName: string;
  avatarUrl: string | null;
  plan: string | null;
  billingStatus: string | null;
  profileHref: string;
  conversations: ConversationPreview[];
  tasks: TaskPreviewItem[];
  notifications: NotificationRow[];
}

/**
 * Bundles everything the dashboard nav bar needs, shared between
 * dashboard/layout.tsx (every internal page) and the public
 * doctors/[slug] page (shown instead of the marketing SiteNav when the
 * signed-in viewer is that profile's own owner). Returns null if the
 * user has no practice yet (e.g. mid-onboarding), matching how the
 * dashboard layout redirects in that case.
 */
export async function getDashboardNavData(userId: string): Promise<DashboardNavData | null> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("practice_id, full_name, role, allowed_sections, avatar_url")
    .eq("id", userId)
    .single();

  if (!profile?.practice_id) return null;

  const isAdmin = profile.role === "clinic_admin" || profile.role === "super_admin";

  let profileHref = "/dashboard/profiles";
  if (isAdmin) {
    const { data: doctorProfile } = await supabase.from("doctor_profiles").select("slug").eq("profile_id", userId).maybeSingle();
    if (doctorProfile) profileHref = `/doctor/${doctorProfile.slug}`;
  }

  const { data: practice } = await supabase.from("practices").select("plan, billing_status").eq("id", profile.practice_id).single();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, type, message, link, read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  const { data: practiceMembers } = await supabase.from("profiles").select("id").eq("practice_id", profile.practice_id);
  const otherMemberIds = (practiceMembers || []).map((m) => m.id).filter((id) => id !== userId);
  await ensureTeamConversation(profile.practice_id, userId, (practiceMembers || []).map((m) => m.id));
  await ensureDirectConversations(profile.practice_id, userId, otherMemberIds);
  const conversationPreviews = (await getConversationSummaries(userId, profile.practice_id)).slice(0, 6);
  const taskPreviews = await getTaskPreview(userId, profile.practice_id);

  return {
    isAdmin,
    sections: profile.allowed_sections || [],
    userId,
    userName: profile.full_name || "Account",
    avatarUrl: profile.avatar_url || null,
    plan: practice?.plan || null,
    billingStatus: practice?.billing_status || null,
    profileHref,
    conversations: conversationPreviews,
    tasks: taskPreviews,
    notifications: notifications || [],
  };
}
