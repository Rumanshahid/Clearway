"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { markAllNotificationsReadAction, markNotificationReadAction } from "./notification-actions";

export interface NotificationRow {
  id: string;
  type: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export default function NotificationBell({
  notifications,
  open,
  onMouseEnter,
  onMouseLeave,
  onToggle,
  onClose,
}: {
  notifications: NotificationRow[];
  open: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onToggle: () => void;
  onClose: () => void;
}) {
  // Optimistic overlay on top of the server-provided prop so read-state
  // updates feel instant instead of waiting on a full server round trip.
  const [locallyRead, setLocallyRead] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  const isRead = (n: NotificationRow) => n.read || locallyRead.has(n.id);
  const unreadCount = notifications.filter((n) => !isRead(n)).length;

  function markOneRead(id: string) {
    setLocallyRead((prev) => new Set(prev).add(id));
    startTransition(() => {
      const fd = new FormData();
      fd.append("id", id);
      markNotificationReadAction(fd);
    });
  }

  function markAllRead() {
    setLocallyRead(new Set(notifications.map((n) => n.id)));
    startTransition(() => {
      markAllNotificationsReadAction();
    });
  }

  return (
    <div className="relative" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <button
        type="button"
        className="relative w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 hover:bg-gray-100 active:scale-95"
        style={{ transition: "background-color 0.2s ease, transform 0.1s ease" }}
        onClick={onToggle}
        aria-label="Notifications"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 6a4 4 0 118 0c0 3 1 4 1 4H3s1-1 1-4z" stroke="var(--gray-600)" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M6.5 12a1.5 1.5 0 003 0" stroke="var(--gray-600)" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full text-[10px] font-semibold flex items-center justify-center px-1"
            style={{ background: "var(--danger-red)", color: "#fff" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <div
        className={`dropdown-panel fixed sm:absolute right-3 sm:right-0 left-3 sm:left-auto top-16 sm:top-11 sm:w-[320px] card z-20 overflow-hidden${open ? " open" : ""}`}
      >
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--gray-200)" }}>
          <span className="text-[13.5px] font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <button className="text-btn text-[12px] text-indigo-600" type="button" onClick={markAllRead}>
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[360px] overflow-y-auto">
          {notifications.length === 0 && (
            <div className="px-4 py-8 text-center text-[13px] text-gray-400">No notifications yet.</div>
          )}
          {notifications.map((n) => {
            const read = isRead(n);
            return (
              <Link
                key={n.id}
                href={n.link || "/dashboard"}
                // Only set an inline background for the unread case — an
                // inline "transparent" for read notifications would
                // permanently win over a hover:bg-gray-50 class (inline
                // styles beat class-based :hover regardless of state),
                // silently killing the hover feedback (same bug fixed
                // earlier in NavLink).
                className={`px-4 py-3 flex flex-col gap-1 transition-colors ${read ? "hover:bg-gray-50" : ""}`}
                style={{ borderBottom: "1px solid var(--gray-200)", ...(read ? {} : { background: "var(--gray-50)" }) }}
                onClick={() => {
                  if (!read) markOneRead(n.id);
                  onClose();
                }}
              >
                <span className="text-[13px] text-gray-900 flex items-center gap-2">
                  {!read && <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ background: "var(--indigo-600)" }} />}
                  {n.message}
                </span>
                {/* Locale/timezone-dependent formatting differs between the server's
                    render and the browser's, so this text can't match on hydration —
                    suppressHydrationWarning is Next.js's documented fix for exactly this. */}
                <span className="text-[11px] text-gray-400" suppressHydrationWarning>
                  {new Date(n.created_at).toLocaleString()}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
