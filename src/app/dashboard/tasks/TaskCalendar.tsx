"use client";

import { useState } from "react";

interface CalendarTask {
  id: string;
  title: string;
  due_date: string | null;
  due_time: string | null;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// All date math derives from todayIso (a fixed string computed once on the
// server) rather than calling `new Date()` during render — otherwise the
// server's render and the browser's hydration pass could land on different
// days/months and produce a hydration mismatch, the same class of bug fixed
// elsewhere in this app (TipsRotator, the notification timestamp).
export default function TaskCalendar({ tasks, todayIso }: { tasks: CalendarTask[]; todayIso: string }) {
  const [year, todayMonth, todayDate] = todayIso.split("-").map(Number);
  const [monthOffset, setMonthOffset] = useState(0);

  const viewMonthIndex = todayMonth - 1 + monthOffset;
  const viewYear = year + Math.floor(viewMonthIndex / 12);
  const viewMonth = ((viewMonthIndex % 12) + 12) % 12;

  const firstDayOfWeek = new Date(Date.UTC(viewYear, viewMonth, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();

  const tasksByDate = new Map<string, CalendarTask[]>();
  for (const t of tasks) {
    if (!t.due_date) continue;
    const list = tasksByDate.get(t.due_date) || [];
    list.push(t);
    tasksByDate.set(t.due_date, list);
  }

  const cells: (number | null)[] = [...Array(firstDayOfWeek).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectedTasks = selectedDate ? tasksByDate.get(selectedDate) || [] : [];

  return (
    <div className="card p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <button type="button" className="btn btn-outline btn-sm" onClick={() => { setMonthOffset((v) => v - 1); setSelectedDate(null); }}>←</button>
        <span className="text-[13.5px] font-semibold">{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => { setMonthOffset((v) => v + 1); setSelectedDate(null); }}>→</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="text-[10.5px] text-gray-400 font-medium py-1">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = monthOffset === 0 && day === todayDate;
          const hasTasks = tasksByDate.has(iso);
          const isSelected = selectedDate === iso;
          return (
            <button
              key={i}
              type="button"
              className="relative rounded-md py-1.5 text-[12.5px]"
              style={{
                background: isSelected ? "var(--indigo-600)" : isToday ? "var(--gray-100)" : "transparent",
                color: isSelected ? "#fff" : "var(--gray-900)",
                fontWeight: isToday ? 600 : 400,
              }}
              onClick={() => setSelectedDate(isSelected ? null : iso)}
            >
              {day}
              {hasTasks && (
                <span
                  className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-[4px] h-[4px] rounded-full"
                  style={{ background: isSelected ? "#fff" : "var(--indigo-600)" }}
                />
              )}
            </button>
          );
        })}
      </div>
      {selectedDate && (
        <div className="mt-3 pt-3 flex flex-col gap-1" style={{ borderTop: "1px solid var(--gray-100)" }}>
          {selectedTasks.length === 0 ? (
            <span className="text-[12.5px] text-gray-400">Nothing due {selectedDate}.</span>
          ) : (
            selectedTasks.map((t) => (
              <span key={t.id} className="text-[12.5px] text-gray-600">
                {t.due_time ? `${t.due_time} — ` : ""}{t.title}
              </span>
            ))
          )}
        </div>
      )}
    </div>
  );
}
