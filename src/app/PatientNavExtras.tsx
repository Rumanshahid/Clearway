import Link from "next/link";
import NotificationBell, { type NotificationRow } from "./dashboard/NotificationBell";
import { markNotificationReadAction, markAllNotificationsReadAction } from "./patient/notification-actions";

export default function PatientNavExtras({ notifications }: { notifications: NotificationRow[] }) {
  return (
    <>
      <Link href="/patient/profile">Profile</Link>
      <Link href="/patient/pa">PA</Link>
      <Link href="/patient/appeals">Appeals</Link>
      <NotificationBell
        notifications={notifications}
        markOneReadAction={markNotificationReadAction}
        markAllReadAction={markAllNotificationsReadAction}
        align="down"
      />
    </>
  );
}
