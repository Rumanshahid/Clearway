"use client";

import { useState } from "react";
import Avatar from "@/components/Avatar";
import DateInput from "@/components/DateInput";
import TimeInput from "@/components/TimeInput";
import { createTaskAction } from "./actions";

interface Member {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export default function TaskForm({
  isAdmin,
  members,
  onSuccess,
}: {
  isAdmin: boolean;
  members: Member[];
  onSuccess?: () => void;
}) {
  const [visibility, setVisibility] = useState<"personal" | "assigned" | "team">("personal");

  return (
    <form action={createTaskAction} onSubmit={onSuccess} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label" htmlFor="title">Title <span style={{ color: "var(--danger-red)" }}>*</span></label>
          <input className="input" id="title" name="title" required />
        </div>
        <div className="col-span-2">
          <label className="label" htmlFor="description">Description</label>
          <textarea className="input" id="description" name="description" rows={2} />
        </div>
        <div>
          <label className="label" htmlFor="due_date">Due date</label>
          <DateInput id="due_date" name="due_date" />
        </div>
        <div>
          <label className="label" htmlFor="due_time">Due time</label>
          <TimeInput id="due_time" name="due_time" />
        </div>
      </div>

      {isAdmin ? (
        <>
          <div>
            <label className="label">Assign to</label>
            <div className="inline-flex rounded-[8px] border overflow-hidden text-[12px]" style={{ borderColor: "var(--gray-200)" }}>
              {([
                { value: "personal", label: "Just me" },
                { value: "assigned", label: "Specific teammates" },
                { value: "team", label: "Whole team" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className="px-3 py-1.5 font-medium"
                  style={visibility === opt.value ? { background: "var(--indigo-600)", color: "#fff" } : { background: "#fff", color: "var(--gray-600)" }}
                  onClick={() => setVisibility(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <input type="hidden" name="visibility" value={visibility} />
          </div>

          {visibility === "assigned" && (
            <div className="flex flex-col gap-1 max-h-[160px] overflow-y-auto border rounded-lg p-2" style={{ borderColor: "var(--gray-200)" }}>
              {members.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-[13px] px-2 py-1">
                  <input type="checkbox" name="assignees" value={m.id} />
                  <Avatar name={m.name} userId={m.id} avatarUrl={m.avatarUrl} size={22} />
                  {m.name}
                </label>
              ))}
            </div>
          )}
        </>
      ) : (
        <input type="hidden" name="visibility" value="personal" />
      )}

      <button className="btn btn-primary self-start" type="submit">Add task</button>
    </form>
  );
}
