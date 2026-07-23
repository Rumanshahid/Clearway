"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOutAction } from "@/app/(auth)/actions";
import Avatar from "@/components/Avatar";

// Self-contained, same pattern as dashboard/ChatBell.tsx. Trigger is the
// patient's avatar photo (or initial) rather than their name + a chevron.
export default function PatientUserMenu({
  name,
  userId,
  avatarUrl,
}: {
  name: string;
  userId: string;
  avatarUrl: string | null;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform hover:scale-110 active:scale-95"
        style={open ? { boxShadow: "0 0 0 2px var(--indigo-600)" } : undefined}
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        title={name}
      >
        <Avatar name={name} userId={userId} avatarUrl={avatarUrl} size={38} />
      </button>

      <div
        className={`dropdown-panel fixed sm:absolute right-3 sm:right-auto left-3 sm:left-full bottom-16 sm:bottom-0 sm:top-auto top-auto sm:ml-2 sm:w-[200px] card z-20 overflow-hidden${open ? " open" : ""}`}
      >
        <Link href="/patient/profile" className="block px-4 py-2.5 text-[13.5px] text-gray-700 hover:bg-gray-50" onClick={() => setOpen(false)}>
          Profile
        </Link>
        <form action={signOutAction} style={{ borderTop: "1px solid var(--gray-200)" }}>
          <button type="submit" className="w-full text-left px-4 py-2.5 text-[13.5px] text-gray-700 hover:bg-gray-50">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
