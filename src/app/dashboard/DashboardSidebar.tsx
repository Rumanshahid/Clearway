import Link from "next/link";
import SidebarLink from "@/components/SidebarLink";
import { GridIcon, FileTextIcon, UsersIcon, FlagIcon, CalendarIcon, PenIcon, HelpCircleIcon } from "@/components/SidebarIcons";
import type { DashboardNavData } from "@/lib/dashboardNav";
import ChatBell from "./ChatBell";
import TasksBell from "./TasksBell";
import NotificationBell from "./NotificationBell";
import UserMenu from "./UserMenu";

// Left icon rail for the staff dashboard -- primary nav, then Tasks
// (directly under Q&A), then Chat/Notifications as circular badges, then
// the account avatar pinned to the bottom. Stays fixed in place while the
// content column scrolls (sticky + h-screen).
export default function DashboardSidebar({ data }: { data: DashboardNavData }) {
  const { isAdmin, sections, userId, userName, avatarUrl, plan, profileHref, conversations, tasks, notifications } = data;
  const showSection = (key: string) => isAdmin || sections.includes(key);

  return (
    <aside className="w-[68px] flex-shrink-0 bg-white border-r flex flex-col items-center py-4 gap-1 sticky top-0 h-screen overflow-y-auto" style={{ borderColor: "var(--gray-200)" }}>
      <Link href="/doctor/dashboard" className="w-9 h-9 rounded-[8px] bg-navy-900 flex items-center justify-center flex-shrink-0 mb-4">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 7h10M7 2l5 5-5 5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>

      {isAdmin && <SidebarLink href="/dashboard/overview" label="Dashboard" icon={<GridIcon />} />}
      {showSection("requests") && (
        <SidebarLink href="/doctor/dashboard" label="PA" icon={<FileTextIcon />} extraPrefixes={["/dashboard/requests"]} />
      )}
      {showSection("patients") && <SidebarLink href="/dashboard/patients" label="Patients" icon={<UsersIcon />} />}
      {showSection("appeals") && <SidebarLink href="/dashboard/appeals" label="Appeals" icon={<FlagIcon />} />}
      <SidebarLink href="/dashboard/appointments" label="Appointments" icon={<CalendarIcon />} />
      <SidebarLink href="/doctor/blog" label="Blog" icon={<PenIcon />} />
      <SidebarLink href="/doctor/questions" label="Q&A" icon={<HelpCircleIcon />} />
      <TasksBell tasks={tasks} />

      <div className="my-2 w-8" style={{ borderTop: "1px solid var(--gray-200)" }} />
      <ChatBell conversations={conversations} />
      <NotificationBell notifications={notifications} />

      <div className="flex-1" />

      <UserMenu name={userName} userId={userId} avatarUrl={avatarUrl} isAdmin={isAdmin} plan={plan} profileHref={profileHref} />
    </aside>
  );
}
