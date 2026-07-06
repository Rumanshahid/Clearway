"use client";

import { useState } from "react";
import Link from "next/link";
import { signOutAction } from "@/app/(auth)/actions";

export default function UserMenu({ name, isAdmin }: { name: string; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        className="flex items-center gap-1.5 text-[13.5px] text-gray-700 font-medium px-2 py-1.5 rounded-md hover:bg-gray-100 active:scale-95"
        style={{ transition: "background-color 0.2s ease, transform 0.1s ease" }}
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
      >
        {name}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 3.5L5 6.5L8 3.5" stroke="var(--gray-400)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />}
      <div
        className={`dropdown-panel fixed sm:absolute right-3 sm:right-0 left-3 sm:left-auto top-16 sm:top-11 sm:w-[200px] card z-20 overflow-hidden${open ? " open" : ""}`}
      >
        <Link
          href="/dashboard/profiles"
          className="block px-4 py-2.5 text-[13.5px] text-gray-700 hover:bg-gray-50"
          onClick={() => setOpen(false)}
        >
          Profile
        </Link>
        {isAdmin && (
          <Link
            href="/dashboard/billing"
            className="block px-4 py-2.5 text-[13.5px] text-gray-700 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            Billing
          </Link>
        )}
        <form action={signOutAction} style={{ borderTop: "1px solid var(--gray-200)" }}>
          <button type="submit" className="w-full text-left px-4 py-2.5 text-[13.5px] text-gray-700 hover:bg-gray-50">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
