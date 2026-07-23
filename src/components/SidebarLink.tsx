"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SidebarLink({
  href,
  label,
  icon,
  extraPrefixes,
  expanded = false,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  extraPrefixes?: string[];
  expanded?: boolean;
}) {
  const pathname = usePathname();
  const active =
    pathname === href ||
    pathname.startsWith(`${href}/`) ||
    !!extraPrefixes?.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={`rounded-xl flex items-center transition-colors flex-shrink-0 ${
        expanded ? "w-full h-11 justify-start gap-3 px-3" : "w-11 h-11 justify-center"
      }`}
      style={active ? { background: "rgba(10, 20, 85, 0.08)", color: "var(--navy-900)" } : { color: "var(--gray-600)" }}
    >
      <span className="flex-shrink-0">{icon}</span>
      {expanded && <span className="text-[13.5px] font-medium truncate">{label}</span>}
    </Link>
  );
}
