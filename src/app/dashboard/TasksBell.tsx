"use client";

import { useRouter } from "next/navigation";
import { useHoverDelay } from "./useHoverDelay";

interface TaskPreviewItem {
  id: string;
  title: string;
  due_date: string | null;
  due_time: string | null;
}

export default function TasksBell({ tasks }: { tasks: TaskPreviewItem[] }) {
  const { open, setOpen, onMouseEnter, onMouseLeave } = useHoverDelay();
  const router = useRouter();

  function goToTasks(openAdd?: boolean) {
    setOpen(false);
    router.push(openAdd ? "/dashboard/tasks?openAdd=1" : "/dashboard/tasks");
  }

  return (
    <div className="relative" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <button
        type="button"
        className="relative w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 hover:bg-gray-100 active:scale-95"
        style={{ transition: "background-color 0.2s ease, transform 0.1s ease" }}
        onClick={() => goToTasks(false)}
        aria-label="Tasks"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 4.5h9M3 8h9M3 11.5h6" stroke="var(--gray-600)" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M2 4.5h.01M2 8h.01M2 11.5h.01" stroke="var(--gray-600)" strokeWidth="1.6" strokeLinecap="round" />
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
        className={`dropdown-panel fixed sm:absolute right-3 sm:right-0 left-3 sm:left-auto top-16 sm:top-11 sm:w-[320px] card z-20 overflow-hidden${open ? " open" : ""}`}
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
