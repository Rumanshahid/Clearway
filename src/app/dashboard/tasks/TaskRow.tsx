"use client";

import { useState } from "react";
import Avatar from "@/components/Avatar";
import TaskCompleteToggle from "./TaskCompleteToggle";
import { updateTaskAction, deleteTaskAction } from "./actions";

interface Person {
  id: string;
  name: string;
  avatarUrl: string | null;
}

const VISIBILITY_LABEL: Record<string, string> = {
  personal: "Personal",
  assigned: "Assigned",
  team: "Team",
};

export default function TaskRow({
  task,
  canManage,
  assignees,
  completedBy,
  isDoneByMe,
  showWhoCompleted,
}: {
  task: { id: string; title: string; description: string | null; visibility: string; due_date: string | null; due_time: string | null };
  canManage: boolean;
  assignees: Person[];
  completedBy: Person[];
  isDoneByMe: boolean;
  showWhoCompleted: boolean;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <form action={updateTaskAction} className="card p-4 flex flex-col gap-3">
        <input type="hidden" name="task_id" value={task.id} />
        <input className="input" name="title" defaultValue={task.title} required />
        <textarea className="input" name="description" defaultValue={task.description || ""} rows={2} />
        <div className="grid grid-cols-2 gap-3">
          <input className="input" name="due_date" type="date" defaultValue={task.due_date || ""} />
          <input className="input" name="due_time" type="time" defaultValue={task.due_time || ""} />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary btn-sm" onClick={() => setEditing(false)}>Save</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </form>
    );
  }

  return (
    <div className="card p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-[14px]">{task.title}</span>
            <span className="text-[10.5px] uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ background: "var(--gray-100)", color: "var(--gray-600)" }}>
              {VISIBILITY_LABEL[task.visibility] || task.visibility}
            </span>
          </div>
          {task.description && <div className="text-[12.5px] text-gray-400 mt-0.5">{task.description}</div>}
          {(task.due_date || task.due_time) && (
            <div className="text-[12px] text-gray-400 mt-1">
              Due {task.due_date || ""} {task.due_time || ""}
            </div>
          )}
        </div>
        {canManage && (
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              type="button"
              className="text-btn text-gray-400 hover:text-indigo-600"
              aria-label="Edit task"
              title="Edit task"
              onClick={() => setEditing(true)}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M11 2.5l2.5 2.5L5 13.5H2.5V11L11 2.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <form
              action={deleteTaskAction}
              onSubmit={(e) => {
                if (!confirm("Remove this task? This can't be undone.")) {
                  e.preventDefault();
                }
              }}
            >
              <input type="hidden" name="task_id" value={task.id} />
              <button
                type="submit"
                className="text-btn text-gray-400 hover:text-[var(--danger-red)]"
                aria-label="Remove task"
                title="Remove task"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 4.5h10M6.5 4.5V3a1 1 0 011-1h1a1 1 0 011 1v1.5M4.5 4.5V13a1 1 0 001 1h5a1 1 0 001-1V4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </form>
          </div>
        )}
      </div>

      {assignees.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {assignees.map((a) => (
            <span key={a.id} className="flex items-center gap-1 text-[12px] text-gray-600">
              <Avatar name={a.name} userId={a.id} avatarUrl={a.avatarUrl} size={18} />
              {a.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-1">
        <TaskCompleteToggle taskId={task.id} done={isDoneByMe} />
        {showWhoCompleted && (
          <div className="flex items-center gap-1">
            {completedBy.length === 0 ? (
              <span className="text-[11.5px] text-gray-400">Nobody yet</span>
            ) : (
              completedBy.map((p) => <Avatar key={p.id} name={p.name} userId={p.id} avatarUrl={p.avatarUrl} size={18} />)
            )}
          </div>
        )}
      </div>
    </div>
  );
}
