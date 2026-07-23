"use client";

import { useEffect, useRef, useState } from "react";
import { toggleLikeAction } from "./actions";
import { REACTION_TYPES, REACTION_META, type ReactionType } from "@/lib/blog-reactions";

// LinkedIn-style reaction picker. The main button is a fast path (click to
// react "like", click again to remove it, same as the old heart button);
// hovering it (or tapping the small caret, for touch) reveals the full
// picker of all seven reactions. Click-outside-to-close matches
// PostMenu.tsx/NavSearch.tsx's pattern elsewhere in this app.
export default function ReactionButton({
  postId,
  slug,
  reactionCounts,
  myReaction,
}: {
  postId: string;
  slug: string;
  reactionCounts: Record<ReactionType, number>;
  myReaction: ReactionType | null;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
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

  const total = REACTION_TYPES.reduce((sum, t) => sum + (reactionCounts[t] || 0), 0);
  const topTypes = REACTION_TYPES.filter((t) => reactionCounts[t] > 0).sort((a, b) => reactionCounts[b] - reactionCounts[a]);

  async function react(type: ReactionType) {
    setOpen(false);
    setPending(true);
    const formData = new FormData();
    formData.set("post_id", postId);
    formData.set("slug", slug);
    formData.set("reaction_type", type);
    await toggleLikeAction(formData);
    setPending(false);
  }

  const current = myReaction ? REACTION_META[myReaction] : null;

  return (
    <div ref={containerRef} className="relative inline-flex items-center" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        disabled={pending}
        onClick={() => react(myReaction || "like")}
        className="flex items-center gap-1.5 text-[13px] font-medium transition-colors hover:text-gray-900"
        style={current ? { color: "var(--indigo-600)" } : { color: "var(--gray-500)" }}
      >
        <span>{current?.emoji || "👍"}</span>
        <span>{current?.label || "Like"}</span>
        {topTypes.length > 0 && (
          <span className="flex items-center gap-1 text-gray-400">
            <span>{topTypes.slice(0, 3).map((t) => REACTION_META[t].emoji).join("")}</span>
            <span>{total}</span>
          </span>
        )}
      </button>
      <button
        type="button"
        aria-label="Choose a reaction"
        onClick={() => setOpen((v) => !v)}
        className="px-1 py-0.5 text-gray-400 hover:text-gray-700"
      >
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-0 mb-1.5 z-10 flex items-center gap-0.5 rounded-full px-1.5 py-1"
          style={{ background: "#fff", border: "1px solid var(--gray-200)", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}
        >
          {REACTION_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              role="menuitem"
              title={REACTION_META[t].label}
              onClick={() => react(t)}
              className="text-[19px] leading-none w-7 h-7 flex items-center justify-center rounded-full hover:scale-125 hover:bg-gray-50 transition-transform"
              style={myReaction === t ? { background: "var(--gray-100)" } : undefined}
            >
              {REACTION_META[t].emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
