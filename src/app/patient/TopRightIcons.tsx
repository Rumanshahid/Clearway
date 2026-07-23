import NotificationBell, { type NotificationRow } from "../dashboard/NotificationBell";
import { markNotificationReadAction, markAllNotificationsReadAction } from "./notification-actions";

// Floats over the content column, pinned to the top-right corner of the
// viewport -- Notifications live here instead of the sidebar.
export default function TopRightIcons({ notifications }: { notifications: NotificationRow[] }) {
  return (
    <div className="fixed top-4 right-5 z-30 flex items-center gap-2">
      <NotificationBell
        notifications={notifications}
        markOneReadAction={markNotificationReadAction}
        markAllReadAction={markAllNotificationsReadAction}
        align="down"
      />
    </div>
  );
}
