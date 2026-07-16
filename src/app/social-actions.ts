"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBlogIdentity } from "@/lib/blog-identity";

// Shared between the blog and the Q&A forum -- following is a relationship
// between two people, not scoped to which feature you met them in.
export async function toggleFollowAction(formData: FormData) {
  const targetUserId = String(formData.get("target_user_id") || "");
  const redirectTo = String(formData.get("redirect_to") || "/");
  const identity = await requireBlogIdentity(redirectTo);

  if (identity.userId === targetUserId) redirect(redirectTo);

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("user_follows")
    .select("follower_id")
    .eq("follower_id", identity.userId)
    .eq("followed_id", targetUserId)
    .maybeSingle();

  if (existing) {
    await supabase.from("user_follows").delete().eq("follower_id", identity.userId).eq("followed_id", targetUserId);
  } else {
    await supabase.from("user_follows").insert({ follower_id: identity.userId, followed_id: targetUserId });
  }

  revalidatePath(redirectTo);
}

export async function updateNotificationPreferenceAction(formData: FormData) {
  const redirectTo = String(formData.get("redirect_to") || "/notifications/settings");
  const identity = await requireBlogIdentity(redirectTo);
  const enabled = formData.get("follow_activity_enabled") === "on";

  const supabase = await createClient();
  await supabase.from("notification_preferences").upsert({
    user_id: identity.userId,
    follow_activity_enabled: enabled,
    updated_at: new Date().toISOString(),
  });

  revalidatePath("/notifications/settings");
  redirect(`${redirectTo}?saved=1`);
}
