import ChatBell from "./ChatBell";
import NotificationBell from "./NotificationBell";
import type { DashboardNavData } from "@/lib/dashboardNav";

// Floats over the content column, pinned to the top-right corner of the
// viewport -- Chat and Notifications live here instead of the sidebar.
export default function TopRightIcons({ data }: { data: Pick<DashboardNavData, "conversations" | "notifications"> }) {
  return (
    <div className="fixed top-4 right-5 z-30 flex items-center gap-2">
      <ChatBell conversations={data.conversations} align="down" />
      <NotificationBell notifications={data.notifications} align="down" />
    </div>
  );
}
