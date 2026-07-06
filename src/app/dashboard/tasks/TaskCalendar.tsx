"use client";

import { useState } from "react";

interface CalendarTask {
  id: string;
  due_date: string | null;
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
export default function TaskCalendar({
  tasks,
  todayIso,
  selectedDate,
  onSelectDate,
}: {
  tasks: CalendarTask[];
  todayIso: string;
  selectedDate: string | null;
  onSelectDate: (iso: string | null) => void;
}) {
  const [year, todayMonth, todayDate] = todayIso.split("-").map(Number);
  const [monthOffset, setMonthOffset] = useState(0);

  const viewMonthIndex = todayMonth - 1 + monthOffset;
  const viewYear = year + Math.floor(viewMonthIndex / 12);
  const viewMonth = ((viewMonthIndex % 12) + 12) % 12;

  const firstDayOfWeek = new Date(Date.UTC(viewYear, viewMonth, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();

  const datesWithTasks = new Set(tasks.filter((t) => t.due_date).map((t) => t.due_date as string));

  const cells: (number | null)[] = [...Array(firstDayOfWeek).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setMonthOffset((v) => v - 1)}>←</button>
        <span className="text-[13.5px] font-semibold">{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setMonthOffset((v) => v + 1)}>→</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="text-[10.5px] text-gray-400 font-medium py-1">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = monthOffset === 0 && day === todayDate;
          const hasTasks = datesWithTasks.has(iso);
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
              onClick={() => onSelectDate(isSelected ? null : iso)}
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
        <button type="button" className="text-btn text-[12px] text-indigo-600 mt-3" onClick={() => onSelectDate(null)}>
          Clear selection
        </button>
      )}
    </div>
  );
}
