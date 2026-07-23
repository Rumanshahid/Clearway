"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/(auth)/actions";
import {
  BarChartIcon,
  BuildingIcon,
  ListChecksIcon,
  TerminalIcon,
  UsersIcon,
  DollarIcon,
  FileEditIcon,
  PenIcon,
  ClockShieldIcon,
  ArrowLeftIcon,
  LogOutIcon,
} from "@/components/SidebarIcons";

const NAV = [
  { href: "/admin/analytics", label: "Analytics", icon: <BarChartIcon /> },
  { href: "/admin/practices", label: "Practices", icon: <BuildingIcon /> },
  { href: "/admin/criteria", label: "Criteria", icon: <ListChecksIcon /> },
  { href: "/admin/prompt", label: "Prompt", icon: <TerminalIcon /> },
  { href: "/admin/users", label: "Users", icon: <UsersIcon /> },
  { href: "/admin/revenue", label: "Revenue", icon: <DollarIcon /> },
  { href: "/admin/content", label: "Content", icon: <FileEditIcon /> },
  { href: "/admin/blog", label: "Blog", icon: <PenIcon /> },
  { href: "/admin/access-log", label: "Access Log", icon: <ClockShieldIcon /> },
];

// Keeps the admin section's distinct dark-navy identity, just as a left
// rail instead of a top bar. Expandable via the toggle between the logo
// and the first nav icon.
export default function AdminSidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);

  return (
    <aside
      className={`relative flex-shrink-0 flex flex-col items-center py-4 gap-1 sticky top-0 h-screen overflow-y-auto transition-[width] duration-200 ${
        expanded ? "w-[200px] items-stretch px-3" : "w-[68px]"
      }`}
      style={{ background: "var(--navy-900)" }}
    >
      <Link
        href="/admin/practices"
        className={`rounded-[8px] flex items-center flex-shrink-0 mb-4 ${expanded ? "w-full h-9 px-2.5 gap-2 justify-start" : "w-9 h-9 justify-center self-center"}`}
        style={{ background: "rgba(255,255,255,.14)" }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
          <path d="M2 7h10M7 2l5 5-5 5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {expanded && <span className="text-white text-[13px] font-semibold truncate">asaanbil Admin</span>}
      </Link>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        className="absolute top-[52px] w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110"
        style={{ right: -12, background: "var(--navy-900)", border: "1px solid rgba(255,255,255,.2)", color: "#A0A8C0" }}
      >
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ transform: expanded ? "rotate(180deg)" : undefined }}>
          <path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className={`rounded-xl flex items-center transition-colors flex-shrink-0 ${expanded ? "w-full h-11 justify-start gap-3 px-3" : "w-11 h-11 justify-center"}`}
            style={active ? { background: "rgba(255,255,255,.1)", color: "#fff" } : { color: "#A0A8C0" }}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {expanded && <span className="text-[13.5px] font-medium truncate">{item.label}</span>}
          </Link>
        );
      })}

      <div className="flex-1" />

      <Link
        href="/doctor/dashboard"
        title="Back to app"
        aria-label="Back to app"
        className={`rounded-xl flex items-center transition-colors flex-shrink-0 ${expanded ? "w-full h-11 justify-start gap-3 px-3" : "w-11 h-11 justify-center"}`}
        style={{ color: "#A0A8C0" }}
      >
        <span className="flex-shrink-0"><ArrowLeftIcon /></span>
        {expanded && <span className="text-[13.5px] font-medium truncate">Back to app</span>}
      </Link>
      <form action={signOutAction} className={expanded ? "w-full" : undefined}>
        <button
          type="submit"
          title="Sign out"
          aria-label="Sign out"
          className={`rounded-xl flex items-center transition-colors flex-shrink-0 ${expanded ? "w-full h-11 justify-start gap-3 px-3" : "w-11 h-11 justify-center"}`}
          style={{ color: "#A0A8C0" }}
        >
          <span className="flex-shrink-0"><LogOutIcon /></span>
          {expanded && <span className="text-[13.5px] font-medium truncate">Sign out</span>}
        </button>
      </form>
    </aside>
  );
}
