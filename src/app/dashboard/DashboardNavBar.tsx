import NavMenus from "./NavMenus";
import type { DashboardNavData } from "@/lib/dashboardNav";

/**
 * Top strip for the staff dashboard -- chat/tasks/notifications/account
 * only. Primary navigation moved to DashboardSidebar.tsx (left rail);
 * these dropdowns stay up here since ChatBell/TasksBell/NotificationBell/
 * UserMenu position their panels relative to a top bar (top-11, right-0).
 */
export default function DashboardNavBar({ data }: { data: DashboardNavData }) {
  const { isAdmin, userName, plan, profileHref, conversations, tasks, notifications } = data;

  return (
    <nav className="bg-white border-b" style={{ borderColor: "var(--gray-200)" }}>
      <div className="px-5 h-14 flex items-center justify-end">
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
