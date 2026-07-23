"use client";

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
// rail instead of a top bar.
export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[68px] flex-shrink-0 flex flex-col items-center py-4 gap-1 sticky top-0 h-screen overflow-y-auto" style={{ background: "var(--navy-900)" }}>
      <Link href="/admin/practices" className="w-9 h-9 rounded-[8px] flex items-center justify-center flex-shrink-0 mb-4" style={{ background: "rgba(255,255,255,.14)" }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 7h10M7 2l5 5-5 5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>

      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform transition-colors flex-shrink-0 hover:scale-110 active:scale-95"
            style={active ? { background: "rgba(255,255,255,.16)", color: "#fff" } : { color: "#A0A8C0" }}
          >
            {item.icon}
          </Link>
        );
      })}

      <div className="flex-1" />

      <Link
        href="/doctor/dashboard"
        title="Back to app"
        aria-label="Back to app"
        className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
        style={{ color: "#A0A8C0" }}
      >
        <ArrowLeftIcon />
      </Link>
      <form action={signOutAction}>
        <button
          type="submit"
          title="Sign out"
          aria-label="Sign out"
          className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
          style={{ color: "#A0A8C0" }}
        >
          <LogOutIcon />
        </button>
      </form>
    </aside>
  );
}
