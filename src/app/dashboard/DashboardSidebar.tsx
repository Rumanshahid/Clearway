import Link from "next/link";
import SidebarLink from "@/components/SidebarLink";
import { GridIcon, FileTextIcon, UsersIcon, FlagIcon, CalendarIcon, PenIcon, HelpCircleIcon } from "@/components/SidebarIcons";
import type { DashboardNavData } from "@/lib/dashboardNav";

// Left icon rail for the staff dashboard -- primary navigation only.
// Search/chat/tasks/notifications/account live in the top strip
// (DashboardNavBar.tsx) instead, since those dropdowns are positioned for
// a top bar (top-11/right-0) and would misalign here.
export default function DashboardSidebar({ data }: { data: DashboardNavData }) {
  const { isAdmin, sections } = data;
  const showSection = (key: string) => isAdmin || sections.includes(key);

  return (
    <aside className="w-[68px] flex-shrink-0 bg-white border-r flex flex-col items-center py-4 gap-1" style={{ borderColor: "var(--gray-200)" }}>
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
    </aside>
  );
}
