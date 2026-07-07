"use client";

import { useCallback, useRef, useState } from "react";
import ChatBell, { type ConversationPreview } from "./ChatBell";
import TasksBell, { type TaskPreviewItem } from "./TasksBell";
import NotificationBell, { type NotificationRow } from "./NotificationBell";
import UserMenu from "./UserMenu";

type MenuKey = "chat" | "tasks" | "notifications" | "account";

// All four nav dropdowns share one "which is open" flag instead of each
// tracking its own — that's what makes switching between them instant.
// Hovering a new icon sets this synchronously, so the previous dropdown's
// `open` prop goes false on the very next render (no delay). Only actually
// leaving every icon (never landing on another one) starts the delayed
// close, giving enough time to move the cursor into the panel itself.
export default function NavMenus({
  conversations,
  tasks,
  notifications,
  userName,
  isAdmin,
  plan,
}: {
  conversations: ConversationPreview[];
  tasks: TaskPreviewItem[];
  notifications: NotificationRow[];
  userName: string;
  isAdmin: boolean;
  plan: string | null;
}) {
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
      <ChatBell
        conversations={conversations}
        open={openMenu === "chat"}
        onMouseEnter={() => openNow("chat")}
        onMouseLeave={() => closeSoon("chat")}
      />
      <TasksBell
        tasks={tasks}
        open={openMenu === "tasks"}
        onMouseEnter={() => openNow("tasks")}
        onMouseLeave={() => closeSoon("tasks")}
      />
      <NotificationBell
        notifications={notifications}
        open={openMenu === "notifications"}
        onMouseEnter={() => openNow("notifications")}
        onMouseLeave={() => closeSoon("notifications")}
        onToggle={() => toggle("notifications")}
        onClose={() => closeNow("notifications")}
      />
      <UserMenu
        name={userName}
        isAdmin={isAdmin}
        plan={plan}
        open={openMenu === "account"}
        onMouseEnter={() => openNow("account")}
        onMouseLeave={() => closeSoon("account")}
        onToggle={() => toggle("account")}
        onClose={() => closeNow("account")}
      />
    </>
  );
}
