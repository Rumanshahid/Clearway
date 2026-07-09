"use client";

import { useState } from "react";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Mirrors dashboard/tasks/TaskCalendar.tsx exactly (grid layout, month
// navigation via local offset, click-to-highlight instead of filtering) so
// the two calendars in this app behave and look identical. All date math
// derives from todayIso (fixed server-computed string) rather than
// `new Date()` during render, to avoid a server/client hydration mismatch
// if the render happens to straddle midnight.
export default function AppointmentCalendar({
  appointments,
  todayIso,
  selectedDate,
  onSelectDate,
}: {
  appointments: { start_at: string }[];
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

  const datesWithAppointments = new Set(appointments.map((a) => a.start_at.slice(0, 10)));

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
          const hasAppointments = datesWithAppointments.has(iso);
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
              {hasAppointments && (
                <span
                  className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-[14px] h-[1.5px] rounded-full"
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
