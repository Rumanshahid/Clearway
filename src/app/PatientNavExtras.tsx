"use client";

import { useState } from "react";
import Link from "next/link";
import NotificationBell, { type NotificationRow } from "./dashboard/NotificationBell";
import { markNotificationReadAction, markAllNotificationsReadAction } from "./patient/notification-actions";

export default function PatientNavExtras({ notifications }: { notifications: NotificationRow[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Link href="/patient/pa">PA</Link>
      <Link href="/patient/appeals">Appeals</Link>
      <NotificationBell
        notifications={notifications}
        open={open}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onToggle={() => setOpen((v) => !v)}
        onClose={() => setOpen(false)}
        markOneReadAction={markNotificationReadAction}
        markAllReadAction={markAllNotificationsReadAction}
      />
    </>
  );
}
