"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { AppointmentStatus } from "@/lib/database.types";
import AppointmentCalendar from "./AppointmentCalendar";
import { markCompleteAction, markNoShowAction, cancelAppointmentAction, checkInAction } from "./actions";

const STATUS_COLORS: Record<AppointmentStatus, { bg: string; fg: string }> = {
  confirmed: { bg: "#EEF0FF", fg: "var(--indigo-600)" },
  checked_in: { bg: "var(--amber-bg)", fg: "var(--amber)" },
  complete: { bg: "var(--success-bg)", fg: "var(--success-green)" },
  no_show: { bg: "var(--danger-bg)", fg: "var(--danger-red)" },
  cancelled: { bg: "var(--gray-100)", fg: "var(--gray-400)" },
};

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  confirmed: "Confirmed",
  checked_in: "Checked In",
  complete: "Complete",
  no_show: "No-Show",
  cancelled: "Cancelled",
};

export interface AppointmentRow {
  id: string;
  patient_full_name: string;
  reason_for_visit: string | null;
  status: AppointmentStatus;
  start_at: string;
  end_at: string;
  is_telehealth: boolean;
}

function AppointmentActionsMenu({ id, status }: { id: string; status: AppointmentStatus }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showStatusActions = status === "confirmed" || status === "checked_in";

  return (
    <div className="relative inline-block" ref={ref}>
      <button type="button" className="text-btn text-gray-400 hover:text-gray-700 px-1" aria-label="Actions" onClick={() => setOpen((v) => !v)}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="3.5" r="1.3" fill="currentColor" />
          <circle cx="8" cy="8" r="1.3" fill="currentColor" />
          <circle cx="8" cy="12.5" r="1.3" fill="currentColor" />
        </svg>
      </button>
      <div className={`dropdown-panel absolute right-0 top-7 w-[150px] card z-20 overflow-hidden${open ? " open" : ""}`}>
        <Link href={`/dashboard/appointments/${id}`} className="block px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50" onClick={() => setOpen(false)}>
          View
        </Link>
        {showStatusActions && (
          <>
            {status === "confirmed" && (
              <form action={checkInAction}>
                <input type="hidden" name="id" value={id} />
                <button type="submit" className="w-full text-left px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50">Check In</button>
              </form>
            )}
            <form action={markCompleteAction}>
              <input type="hidden" name="id" value={id} />
              <button type="submit" className="w-full text-left px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50">Complete</button>
            </form>
            <form action={markNoShowAction}>
              <input type="hidden" name="id" value={id} />
              <button type="submit" className="w-full text-left px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50">No-Show</button>
            </form>
            <form action={cancelAppointmentAction}>
              <input type="hidden" name="id" value={id} />
              <button type="submit" className="w-full text-left px-3 py-2 text-[13px] text-gray-400 hover:bg-gray-50">Cancel</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// Selecting a calendar day highlights that day's rows in the list below
// rather than filtering the rest out -- same pattern as
// dashboard/tasks/TasksBoard.tsx, so the two "calendar + list" screens in
// this app behave identically.
export default function AppointmentsBoard({ appointments, todayIso }: { appointments: AppointmentRow[]; todayIso: string }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  return (
    <div className="grid gap-6" style={{ gridTemplateColumns: "280px 1fr" }}>
      <div className="flex-shrink-0">
        <AppointmentCalendar
          appointments={appointments}
          todayIso={todayIso}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>

      <div className="min-w-0">
        <div className="card overflow-hidden overflow-x-auto">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="text-left text-gray-400 text-[11px] uppercase tracking-wide" style={{ borderBottom: "1px solid var(--gray-200)" }}>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Patient</th>
                <th className="px-5 py-3 font-semibold">Reason</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 && (
                <tr><td className="px-5 py-10 text-center text-gray-400" colSpan={5}>No appointments yet.</td></tr>
              )}
              {appointments.map((a) => {
                const highlighted = !!selectedDate && a.start_at.slice(0, 10) === selectedDate;
                return (
                  <tr key={a.id} style={{ borderBottom: "1px solid var(--gray-100)", background: highlighted ? "#EEF0FF" : undefined }}>
                    <td className="px-5 py-3">
                      {new Date(a.start_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      {a.is_telehealth && <span className="text-gray-400"> · Telehealth</span>}
                    </td>
                    <td className="px-5 py-3">{a.patient_full_name}</td>
                    <td className="px-5 py-3 text-gray-600">{a.reason_for_visit || "—"}</td>
                    <td className="px-5 py-3">
                      <span className="status-pill" style={{ background: STATUS_COLORS[a.status].bg, color: STATUS_COLORS[a.status].fg }}>
                        {STATUS_LABELS[a.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end">
                        <AppointmentActionsMenu id={a.id} status={a.status} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
