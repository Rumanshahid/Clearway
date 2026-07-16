import { createAdminClient } from "@/lib/supabase/server";
import { notify } from "@/lib/notifications";
import { isFollowActivityEnabled } from "@/lib/notification-preferences";

// Fired when a followed user publishes a new blog post or asks a new
// question -- every follower who hasn't turned the toggle off gets an
// in-app notification. Uses the service-role client since this runs after
// the triggering user's own insert already succeeded and reads across
// other users' follow/preference rows, which their own RLS-scoped session
// can't do.
export async function notifyFollowersOfNewContent(authorUserId: string, message: string, link: string) {
  const admin = await createAdminClient();
  const { data: followers } = await admin.from("user_follows").select("follower_id").eq("followed_id", authorUserId);
  if (!followers || followers.length === 0) return;

  await Promise.all(
    followers.map(async (row) => {
      const enabled = await isFollowActivityEnabled(row.follower_id);
      if (!enabled) return;
      await notify({ userId: row.follower_id, type: "follow_activity", message, link });
    })
  );
}
