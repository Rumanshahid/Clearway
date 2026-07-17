"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Magnifying-glass icon that expands into an inline text input on click,
// rather than navigating straight to /search -- lets someone start typing
// without a full page transition first, closer to how a native app search
// affordance behaves.
export default function NavSearch() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

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

  function submit() {
    const q = value.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setOpen(false);
    setValue("");
  }

  return (
    <div ref={containerRef} className="relative flex items-center">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex items-center overflow-hidden"
        style={{ transition: "width 0.28s cubic-bezier(0.16,1,0.3,1)", width: open ? 200 : 0 }}
      >
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search…"
          aria-label="Search"
          className="input"
          style={{ width: 200, marginRight: 8 }}
        />
      </form>
      <button
        type="button"
        onClick={() => (open ? submit() : setOpen(true))}
        aria-label="Search"
        className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 hover:bg-gray-100 active:scale-95"
        style={{ transition: "background-color 0.2s ease, transform 0.1s ease" }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="5" stroke="var(--gray-600)" strokeWidth="1.4" />
          <path d="M11 11l4 4" stroke="var(--gray-600)" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
