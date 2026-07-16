import { createAdminClient } from "@/lib/supabase/server";

// No row = notifications on -- this is an opt-out model (matching the
// signup-time default of consent_notifications=true), not opt-in, so a
// brand new user who never visited the settings page still gets notified.
export async function isFollowActivityEnabled(userId: string): Promise<boolean> {
  const admin = await createAdminClient();
  const { data } = await admin
    .from("notification_preferences")
    .select("follow_activity_enabled")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.follow_activity_enabled ?? true;
}
