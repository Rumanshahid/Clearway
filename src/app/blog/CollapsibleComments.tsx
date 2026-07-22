"use client";

import { useState } from "react";

// Client-only toggle wrapping server-rendered content -- the comment list
// and add-comment form are still rendered on the server (real data, no
// client fetch), this just controls visibility. Plain <details>/<summary>
// doesn't work here because the Like/Share/Upvote buttons sit in the same
// action row and a click on any of them would bubble up and toggle a
// <summary> open/closed as an unwanted side effect.
export default function CollapsibleComments({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <path d="M2 3.5h12v8H6l-3 3v-3H2v-8z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
        {label}
      </button>
      {open && <div className="mt-4 pt-4 w-full" style={{ borderTop: "1px solid var(--gray-200)" }}>{children}</div>}
    </>
  );
}
