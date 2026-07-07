"use client";

import { useRouter } from "next/navigation";

export interface ConversationPreview {
  id: string;
  type: string;
  label: string;
  lastMessage: string | null;
}

export default function ChatBell({
  conversations,
  open,
  onMouseEnter,
  onMouseLeave,
}: {
  conversations: ConversationPreview[];
  open: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const router = useRouter();

  function goToChat(conversationId?: string) {
    router.push(conversationId ? `/dashboard/chat?conversation=${conversationId}` : "/dashboard/chat");
  }

  return (
    <div className="relative" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <button
        type="button"
        className="relative w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 hover:bg-gray-100 active:scale-95"
        style={{ transition: "background-color 0.2s ease, transform 0.1s ease" }}
        onClick={() => goToChat()}
        aria-label="Chat"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 3.5h12v7H6l-3 2.5v-2.5H2v-7z" stroke="var(--gray-600)" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      </button>

      <div
        className={`dropdown-panel fixed sm:absolute right-3 sm:right-0 left-3 sm:left-auto top-16 sm:top-11 sm:w-[320px] card z-20 overflow-hidden${open ? " open" : ""}`}
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
