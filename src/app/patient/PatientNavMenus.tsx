"use client";

import { useCallback, useRef, useState } from "react";
import NotificationBell, { type NotificationRow } from "../dashboard/NotificationBell";
import PatientUserMenu from "./PatientUserMenu";
import { markNotificationReadAction, markAllNotificationsReadAction } from "./notification-actions";

type MenuKey = "notifications" | "account";

export default function PatientNavMenus({ notifications, name }: { notifications: NotificationRow[]; name: string }) {
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingClose = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const openNow = useCallback(
    (key: MenuKey) => {
      clearPendingClose();
      setOpenMenu(key);
    },
    [clearPendingClose]
  );

  const closeSoon = useCallback(
    (key: MenuKey) => {
      clearPendingClose();
      closeTimeoutRef.current = setTimeout(() => {
        setOpenMenu((current) => (current === key ? null : current));
      }, 250);
    },
    [clearPendingClose]
  );

  const closeNow = useCallback((key: MenuKey) => {
    setOpenMenu((current) => (current === key ? null : current));
  }, []);

  const toggle = useCallback(
    (key: MenuKey) => {
      clearPendingClose();
      setOpenMenu((current) => (current === key ? null : key));
    },
    [clearPendingClose]
  );

  return (
    <>
      <NotificationBell
        notifications={notifications}
        open={openMenu === "notifications"}
        onMouseEnter={() => openNow("notifications")}
        onMouseLeave={() => closeSoon("notifications")}
        onToggle={() => toggle("notifications")}
        onClose={() => closeNow("notifications")}
        markOneReadAction={markNotificationReadAction}
        markAllReadAction={markAllNotificationsReadAction}
      />
      <PatientUserMenu
        name={name}
        open={openMenu === "account"}
        onMouseEnter={() => openNow("account")}
        onMouseLeave={() => closeSoon("account")}
        onToggle={() => toggle("account")}
        onClose={() => closeNow("account")}
      />
    </>
  );
}
