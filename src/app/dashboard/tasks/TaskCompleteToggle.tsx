"use client";

import { useRef } from "react";
import { toggleTaskCompletionAction } from "./actions";

export default function TaskCompleteToggle({ taskId, done }: { taskId: string; done: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={toggleTaskCompletionAction} className="flex items-center gap-1.5">
      <input type="hidden" name="task_id" value={taskId} />
      <input type="hidden" name="done" value={done ? "false" : "true"} />
      <button
        type="submit"
        className="flex items-center gap-1.5 text-[12.5px]"
        style={{ color: done ? "var(--success-green)" : "var(--gray-400)" }}
      >
        <span
          className="w-[16px] h-[16px] rounded flex items-center justify-center flex-shrink-0"
          style={{ border: `1.5px solid ${done ? "var(--success-green)" : "var(--gray-300)"}`, background: done ? "var(--success-green)" : "transparent" }}
        >
          {done && <span style={{ color: "#fff", fontSize: "11px", lineHeight: 1 }}>✓</span>}
        </span>
        {done ? "Done" : "Mark done"}
      </button>
    </form>
  );
}
