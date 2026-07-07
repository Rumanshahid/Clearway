"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function isActive(pathname: string, href: string, extraPrefixes?: string[]): boolean {
  // "/dashboard" itself is the PA requests root — every other dashboard
  // route also starts with "/dashboard/", so it can't use prefix matching
  // or it would light up for every page. Everything else is specific
  // enough (e.g. "/dashboard/patients") that prefix matching is correct,
  // so a detail page like "/dashboard/patients/123" still highlights it.
  const matchesOwn = href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  if (matchesOwn) return true;
  return !!extraPrefixes?.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default function NavLink({
  href,
  extraPrefixes,
  children,
}: {
  href: string;
  extraPrefixes?: string[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, href, extraPrefixes);

  return (
    <Link
      href={href}
      className="px-2.5 py-1.5 rounded-md text-[13.5px] transition-colors hover:bg-gray-100"
      style={{
        color: active ? "var(--gray-900)" : "var(--gray-600)",
        fontWeight: active ? 600 : 400,
        background: active ? "var(--gray-100)" : "transparent",
      }}
    >
      {children}
    </Link>
  );
}
