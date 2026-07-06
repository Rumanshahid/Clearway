"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import TaskCalendar from "./TaskCalendar";
import TaskForm from "./TaskForm";
import TaskRow, { type TaskRowData } from "./TaskRow";

export default function TasksBoard({
  isAdmin,
  members,
  todayIso,
  rows,
}: {
  isAdmin: boolean;
  members: { id: string; name: string; avatarUrl: string | null }[];
  todayIso: string;
  rows: TaskRowData[];
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="grid gap-6" style={{ gridTemplateColumns: "280px 1fr" }}>
      <div className="flex-shrink-0">
        <TaskCalendar
          todayIso={todayIso}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          tasks={rows.map((r) => ({ id: r.task.id, due_date: r.task.due_date }))}
        />
      </div>

      <div className="min-w-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[17px] font-semibold">Tasks</h2>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
            + Add task
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {rows.length > 0 ? (
            rows.map((r) => (
              <TaskRow
                key={r.task.id}
                task={r.task}
                canManage={r.canManage}
                assignees={r.assignees}
                completedBy={r.completedBy}
                isDoneByMe={r.isDoneByMe}
                showWhoCompleted={r.showWhoCompleted}
                highlighted={!!selectedDate && r.task.due_date === selectedDate}
              />
            ))
          ) : (
            <div className="card p-10 text-center text-gray-400 text-[13.5px]">No tasks yet.</div>
          )}
        </div>
      </div>

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="New task">
        <TaskForm isAdmin={isAdmin} members={members} onSuccess={() => setShowAddModal(false)} />
      </Modal>
    </div>
  );
}
