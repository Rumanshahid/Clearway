"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SidebarLink({
  href,
  label,
  icon,
  extraPrefixes,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  extraPrefixes?: string[];
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
      className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform transition-colors flex-shrink-0 hover:scale-125 active:scale-95"
      style={active ? { background: "var(--navy-900)", color: "#fff" } : { color: "var(--gray-600)" }}
    >
      {icon}
    </Link>
  );
}
