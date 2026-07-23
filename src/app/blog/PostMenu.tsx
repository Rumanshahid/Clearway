"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { deleteOwnBlogPostAction } from "./actions";

// Post-owner/super-admin actions collapsed behind a kebab menu instead of
// two always-visible text buttons -- same click-outside-to-close pattern as
// NavSearch.tsx.
export default function PostMenu({
  postId,
  postUrl,
  basePath,
}: {
  postId: string;
  postUrl: string;
  basePath: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Post options"
        aria-haspopup="menu"
        aria-expanded={open}
        className="w-7 h-7 rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="3.5" r="1.3" fill="currentColor" />
          <circle cx="8" cy="8" r="1.3" fill="currentColor" />
          <circle cx="8" cy="12.5" r="1.3" fill="currentColor" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-10 rounded-lg overflow-hidden"
          style={{ background: "#fff", border: "1px solid var(--gray-200)", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", minWidth: 140 }}
        >
          <Link
            href={`${postUrl}/edit`}
            role="menuitem"
            className="block px-3.5 py-2 text-[13px] text-gray-900 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            Edit
          </Link>
          <form action={deleteOwnBlogPostAction}>
            <input type="hidden" name="post_id" value={postId} />
            <input type="hidden" name="base_path" value={basePath} />
            <button
              type="submit"
              role="menuitem"
              className="w-full text-left px-3.5 py-2 text-[13px] hover:bg-gray-50"
              style={{ color: "var(--danger-red)" }}
            >
              Delete
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
