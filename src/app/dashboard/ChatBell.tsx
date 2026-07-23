"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export interface ConversationPreview {
  id: string;
  type: string;
  label: string;
  lastMessage: string | null;
}

// Self-contained (own open state + click-outside-to-close) so it can be
// placed anywhere in the sidebar independently of the other icons --
// dropdown opens to the right (sm:left-full) since the trigger now lives
// in a left rail, not a top bar.
export default function ChatBell({ conversations }: { conversations: ConversationPreview[] }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function goToChat(conversationId?: string) {
    setOpen(false);
    router.push(conversationId ? `/dashboard/chat?conversation=${conversationId}` : "/dashboard/chat");
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className="relative w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 transition-transform hover:scale-110 active:scale-95"
        style={{ border: "1px solid var(--gray-200)", boxShadow: "0 1px 2px rgba(16,24,40,0.04)", ...(open ? { background: "var(--gray-100)" } : {}) }}
        onClick={() => setOpen((v) => !v)}
        aria-label="Chat"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 3.5h12v7H6l-3 2.5v-2.5H2v-7z" stroke="var(--gray-600)" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      </button>

      <div
        className={`dropdown-panel fixed sm:absolute right-3 sm:right-auto left-3 sm:left-full top-16 sm:top-0 sm:ml-2 sm:w-[320px] card z-20 overflow-hidden${open ? " open" : ""}`}
      >
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--gray-200)" }}>
          <span className="text-[13.5px] font-semibold">Chat</span>
          <button type="button" className="text-btn text-[12px] text-indigo-600" onClick={() => goToChat()}>
            View more
          </button>
        </div>
        <div className="max-h-[360px] overflow-y-auto">
          {conversations.length === 0 && (
            <div className="px-4 py-8 text-center text-[13px] text-gray-400">No conversations yet.</div>
          )}
          {conversations.map((c) => (
            <button
              key={c.id}
              type="button"
              className="w-full flex flex-col items-start gap-0.5 text-left px-4 py-3 text-[13px] hover:bg-gray-50 transition-colors"
              style={{ borderBottom: "1px solid var(--gray-200)" }}
              onClick={() => goToChat(c.id)}
            >
              <span className="flex items-center gap-1.5">
                {(c.type === "group" || c.type === "team") && <span className="text-gray-400">👥</span>}
                {c.label}
              </span>
              {c.lastMessage && <span className="text-[12px] text-gray-400 truncate w-full">{c.lastMessage}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
