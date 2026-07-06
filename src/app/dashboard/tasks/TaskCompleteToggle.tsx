"use client";

import { toggleTaskCompletionAction } from "./actions";

export default function TaskCompleteToggle({ taskId, done }: { taskId: string; done: boolean }) {
  return (
    <form action={toggleTaskCompletionAction}>
      <input type="hidden" name="task_id" value={taskId} />
      <input type="hidden" name="done" value={done ? "false" : "true"} />
      <button
        type="submit"
        className="w-[20px] h-[20px] rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          border: done ? "none" : "1.5px solid var(--gray-400)",
          background: done ? "var(--success-green)" : "transparent",
        }}
        aria-label={done ? "Mark not done" : "Mark done"}
        title={done ? "Mark not done" : "Mark done"}
      >
        {done && (
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M3.5 8.5l3 3 6-7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    </form>
  );
}
