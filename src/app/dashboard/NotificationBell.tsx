"use client";

import { useState } from "react";
import Link from "next/link";
import { markAllNotificationsReadAction, markNotificationReadAction } from "./notification-actions";

interface NotificationRow {
  id: string;
  type: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export default function NotificationBell({ notifications }: { notifications: NotificationRow[] }) {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        type="button"
        className="relative w-9 h-9 rounded-full flex items-center justify-center border"
        style={{ borderColor: "var(--gray-200)" }}
        onClick={() => setOpen((v) => !v)}
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

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 w-[320px] card z-20 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--gray-200)" }}>
              <span className="text-[13.5px] font-semibold">Notifications</span>
              {unreadCount > 0 && (
                <form action={markAllNotificationsReadAction}>
                  <button className="text-[12px] text-indigo-600" type="submit">Mark all read</button>
                </form>
              )}
            </div>
            <div className="max-h-[360px] overflow-y-auto">
              {notifications.length === 0 && (
                <div className="px-4 py-8 text-center text-[13px] text-gray-400">No notifications yet.</div>
              )}
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="px-4 py-3 flex flex-col gap-1"
                  style={{ borderBottom: "1px solid var(--gray-200)", background: n.read ? "transparent" : "var(--gray-50)" }}
                >
                  <Link href={n.link || "/dashboard"} className="text-[13px] text-gray-900" onClick={() => setOpen(false)}>
                    {n.message}
                  </Link>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">{new Date(n.created_at).toLocaleString()}</span>
                    {!n.read && (
                      <form action={markNotificationReadAction}>
                        <input type="hidden" name="id" value={n.id} />
                        <button className="text-[11px] text-indigo-600" type="submit">Mark read</button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
