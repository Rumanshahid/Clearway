"use client";

import { updateTaskStatusAction } from "./actions";

const OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

export default function TaskStatusSelect({ taskId, status }: { taskId: string; status: string }) {
  return (
    <form action={updateTaskStatusAction} onChange={(e) => (e.currentTarget as HTMLFormElement).requestSubmit()}>
      <input type="hidden" name="task_id" value={taskId} />
      <select className="input" name="status" defaultValue={status} style={{ padding: "5px 8px", fontSize: "12.5px", width: "auto" }}>
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </form>
  );
}
