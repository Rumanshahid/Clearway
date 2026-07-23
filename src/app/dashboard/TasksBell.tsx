"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export interface TaskPreviewItem {
  id: string;
  title: string;
  due_date: string | null;
  due_time: string | null;
}

// Self-contained, same pattern as ChatBell.tsx.
export default function TasksBell({ tasks }: { tasks: TaskPreviewItem[] }) {
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

  function goToTasks(openAdd?: boolean) {
    setOpen(false);
    router.push(openAdd ? "/dashboard/tasks?openAdd=1" : "/dashboard/tasks");
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className="relative w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 transition-transform hover:scale-125 active:scale-95"
        style={{ border: "1px solid var(--gray-200)", boxShadow: "0 1px 2px rgba(16,24,40,0.04)", ...(open ? { background: "var(--gray-100)" } : {}) }}
        onClick={() => setOpen((v) => !v)}
        aria-label="Tasks"
      >
        <svg width="17" height="17" viewBox="0 0 16 16" fill="none">
          <path d="M3 4.5h9M3 8h9M3 11.5h6" stroke="var(--gray-900)" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M2 4.5h.01M2 8h.01M2 11.5h.01" stroke="var(--gray-900)" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        {tasks.length > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full text-[10px] font-semibold flex items-center justify-center px-1"
            style={{ background: "var(--danger-red)", color: "#fff" }}
          >
            {tasks.length > 9 ? "9+" : tasks.length}
          </span>
        )}
      </button>

      <div
        className={`dropdown-panel fixed sm:absolute right-3 sm:right-auto left-3 sm:left-full top-16 sm:top-0 sm:ml-2 sm:w-[320px] card z-20 overflow-hidden${open ? " open" : ""}`}
      >
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--gray-200)" }}>
          <span className="text-[13.5px] font-semibold">Tasks</span>
          <div className="flex items-center gap-3">
            <button type="button" className="text-btn text-[12px] text-indigo-600" onClick={() => goToTasks(true)}>
              + Add
            </button>
            <button type="button" className="text-btn text-[12px] text-indigo-600" onClick={() => goToTasks(false)}>
              View more
            </button>
          </div>
        </div>
        <div className="max-h-[360px] overflow-y-auto">
          {tasks.length === 0 && (
            <div className="px-4 py-8 text-center text-[13px] text-gray-400">Nothing outstanding.</div>
          )}
          {tasks.map((t) => (
            <button
              key={t.id}
              type="button"
              className="w-full flex flex-col items-start gap-0.5 text-left px-4 py-3 text-[13px] hover:bg-gray-50 transition-colors"
              style={{ borderBottom: "1px solid var(--gray-200)" }}
              onClick={() => goToTasks(false)}
            >
              <span className="text-gray-900">{t.title}</span>
              {(t.due_date || t.due_time) && (
                <span className="text-[11.5px] text-gray-400">Due {t.due_date || ""} {t.due_time || ""}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
