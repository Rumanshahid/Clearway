"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function isActive(pathname: string, href: string, extraPrefixes?: string[]): boolean {
  // "/doctor/dashboard" itself is the PA requests root — matched via its
  // own extraPrefixes ("/dashboard/requests") rather than prefix-matching
  // its own href, since nothing else starts with "/doctor/dashboard/".
  const matchesOwn = href === "/doctor/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
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
      className="relative px-2.5 py-1.5 rounded-md text-[13.5px] transition-colors hover:bg-gray-100"
      // Never set an inline background here — the active page is marked by
      // the underline bar below, not a persistent fill, so the only
      // background this link ever shows is the hover:bg-gray-100 class on
      // mouseover (an inline background of any value, including
      // "transparent", would permanently block that class since inline
      // styles beat class-based :hover regardless of state).
      style={active ? { color: "var(--gray-900)", fontWeight: 600 } : { color: "var(--gray-600)", fontWeight: 400 }}
    >
      {children}
      {active && (
        <span
          className="absolute left-2 right-2 rounded-full"
          style={{ bottom: 2, height: 2, background: "var(--indigo-600)" }}
        />
      )}
    </Link>
  );
}
