import Link from "next/link";
import NavMenus from "./NavMenus";
import NavLink from "./NavLink";
import type { DashboardNavData } from "@/lib/dashboardNav";

/**
 * The internal dashboard nav bar (logo, section links, chat/tasks/
 * notifications, account menu), extracted out of dashboard/layout.tsx so
 * it can also render on a doctor's own public profile page in place of
 * the marketing SiteNav -- signed in and looking at your own page should
 * feel like still being in the dashboard, not like a logged-out visitor.
 */
export default function DashboardNavBar({ data }: { data: DashboardNavData }) {
  const { isAdmin, sections, userName, plan, profileHref, conversations, tasks, notifications } = data;
  const showSection = (key: string) => isAdmin || sections.includes(key);

  return (
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
          <div className="flex items-center gap-1">
            {isAdmin && <NavLink href="/dashboard/overview">Dashboard</NavLink>}
            {showSection("requests") && <NavLink href="/dashboard" extraPrefixes={["/dashboard/requests"]}>PA</NavLink>}
            {showSection("patients") && <NavLink href="/dashboard/patients">Patients</NavLink>}
            {showSection("appeals") && <NavLink href="/dashboard/appeals">Appeals</NavLink>}
            <NavLink href="/dashboard/appointments">Appointments</NavLink>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <NavMenus
            conversations={conversations}
            tasks={tasks}
            notifications={notifications}
            userName={userName}
            isAdmin={isAdmin}
            plan={plan}
            profileHref={profileHref}
          />
        </div>
      </div>
    </nav>
  );
}
