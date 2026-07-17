import Link from "next/link";
import "../../landing.css";
import SiteNav from "../../SiteNav";
import SiteFooter from "../../SiteFooter";
import LandingScripts from "../../LandingScripts";
import { requireBlogIdentity } from "@/lib/blog-identity";
import { createClient } from "@/lib/supabase/server";
import { updateNotificationPreferenceAction } from "../../social-actions";

export default async function NotificationSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const identity = await requireBlogIdentity("/notifications/settings");
  const { saved } = await searchParams;

  const supabase = await createClient();
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("follow_activity_enabled")
    .eq("user_id", identity.userId)
    .maybeSingle();
  const enabled = prefs?.follow_activity_enabled ?? true;

  return (
    <div className="landing-root">
      <SiteNav />
      <div className="max-w-[560px] mx-auto px-5 sm:px-10 py-14">
        <Link href={identity.authorType === "patient" ? "/patient" : "/dashboard"} className="text-[13px] text-indigo-600 font-medium">← Back</Link>
        <h1 className="text-[24px] font-semibold mt-4 mb-1">Notification settings</h1>
        <p className="text-[14px] text-gray-600 mb-6">Control whether you&apos;re notified about activity from people you follow.</p>

        {saved && (
          <div className="mb-4 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--success-bg)", color: "var(--success-green)" }}>
            Saved.
          </div>
        )}

        <form action={updateNotificationPreferenceAction} className="card p-5">
          <input type="hidden" name="redirect_to" value="/notifications/settings" />
          <label className="flex items-start gap-3 text-[14px] text-gray-700">
            <input type="checkbox" name="follow_activity_enabled" defaultChecked={enabled} className="mt-1" />
            <span>
              <span className="block font-medium text-gray-900">Notify me about new blog posts and questions</span>
              <span className="block text-[13px] text-gray-500 mt-0.5">From people you follow, in the Blog and Q&amp;A sections.</span>
            </span>
          </label>
          <button type="submit" className="btn btn-primary mt-5">Save</button>
        </form>
      </div>
      <SiteFooter />
      <LandingScripts />
    </div>
  );
}
