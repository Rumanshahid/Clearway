"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ConversationPreview {
  id: string;
  type: string;
  label: string;
  lastMessage: string | null;
}

export default function ChatBell({ conversations }: { conversations: ConversationPreview[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function goToChat(conversationId?: string) {
    setOpen(false);
    router.push(conversationId ? `/dashboard/chat?conversation=${conversationId}` : "/dashboard/chat");
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="relative w-10 h-10 rounded-full flex items-center justify-center border flex-shrink-0 transition-colors hover:bg-gray-100 active:scale-95"
        style={{ borderColor: "var(--gray-200)", transition: "background-color 0.2s ease, transform 0.1s ease" }}
        onClick={() => setOpen((v) => !v)}
        aria-label="Chat"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 3.5h12v7H6l-3 2.5v-2.5H2v-7z" stroke="var(--gray-600)" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      </button>

      {open && <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />}
      <div
        className={`dropdown-panel fixed sm:absolute right-3 sm:right-0 left-3 sm:left-auto top-16 sm:top-11 sm:w-[320px] card z-20 overflow-hidden${open ? " open" : ""}`}
      >
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--gray-200)" }}>
          <span className="text-[13.5px] font-semibold">Chat</span>
          <button type="button" className="text-btn text-[12px] text-indigo-600" onClick={() => goToChat()}>
            Expand
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
              className="w-full flex flex-col items-start gap-0.5 text-left px-4 py-3 text-[13px]"
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
