import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureTeamConversation, ensureDirectConversations, getConversationSummaries } from "@/lib/chat";
import { getTaskPreview } from "@/lib/taskPreview";
import NotificationBell from "./NotificationBell";
import ChatBell from "./ChatBell";
import TasksBell from "./TasksBell";
import UserMenu from "./UserMenu";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("practice_id, full_name, role, allowed_sections")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("dashboard layout: failed to load profile", profileError);
  }

  if (!profile?.practice_id) redirect("/onboarding");

  // clinic_admin is the practice's "Doctor / Admin" role — full nav. Staff
  // (clinic_user) only see the sections an admin granted them.
  const isAdmin = profile.role === "clinic_admin" || profile.role === "super_admin";
  const sections = profile.allowed_sections || [];
  const showSection = (key: string) => isAdmin || sections.includes(key);

  const { data: practice, error: practiceError } = await supabase
    .from("practices")
    .select("name, plan, billing_status")
    .eq("id", profile.practice_id)
    .single();

  if (practiceError) {
    console.error("dashboard layout: failed to load practice", practiceError);
  }

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, type, message, link, read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  const { data: practiceMembers } = await supabase.from("profiles").select("id").eq("practice_id", profile.practice_id);
  const otherMemberIds = (practiceMembers || []).map((m) => m.id).filter((id) => id !== user.id);
  await ensureTeamConversation(profile.practice_id, user.id, (practiceMembers || []).map((m) => m.id));
  await ensureDirectConversations(profile.practice_id, user.id, otherMemberIds);
  const conversationPreviews = (await getConversationSummaries(user.id, profile.practice_id)).slice(0, 6);
  const taskPreviews = await getTaskPreview(user.id, profile.practice_id);

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white border-b" style={{ borderColor: "var(--gray-200)" }}>
        <div className="max-w-[1300px] mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2 text-[17px] font-semibold text-gray-900">
              <span className="w-[24px] h-[24px] rounded-[6px] bg-navy-900 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7h10M7 2l5 5-5 5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              asaanbil.com
            </Link>
            <div className="flex items-center gap-6 text-[13.5px] text-gray-600">
              {isAdmin && <Link href="/dashboard/overview">Dashboard</Link>}
              {showSection("requests") && <Link href="/dashboard">PA</Link>}
              {showSection("patients") && <Link href="/dashboard/patients">Patients</Link>}
              {showSection("appeals") && <Link href="/dashboard/appeals">Appeals</Link>}
              <Link href="/dashboard/resources">Resources</Link>
              {isAdmin && <Link href="/dashboard/team">Team</Link>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[12.5px] text-gray-400">
              {practice?.name} · <span className="capitalize">{practice?.plan}</span> plan
            </span>
            <ChatBell conversations={conversationPreviews} />
            <TasksBell tasks={taskPreviews} />
            <NotificationBell notifications={notifications || []} />
            <UserMenu name={profile.full_name || "Account"} isAdmin={isAdmin} />
          </div>
        </div>
      </nav>
      {practice?.billing_status === "suspended" && (
        <div className="text-[13px] px-6 py-2 text-center" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
          Your account is suspended for billing. <Link href="/dashboard/billing" className="underline">Update billing</Link> to resume drafting letters.
        </div>
      )}
      {practice?.billing_status === "grace_period" && (
        <div className="text-[13px] px-6 py-2 text-center" style={{ background: "var(--amber-bg)", color: "var(--amber)" }}>
          Your last payment failed. <Link href="/dashboard/billing" className="underline">Update billing</Link> before your account is suspended.
        </div>
      )}
      <main className="flex-1 bg-gray-50">{children}</main>
    </div>
  );
}
