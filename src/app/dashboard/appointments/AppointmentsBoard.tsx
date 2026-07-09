"use client";

import { useState } from "react";
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

// Which appointments can transition where -- confirmed can move to any of
// the four; checked_in can move to any of them except back to itself via
// checkInAction (there's no "un-check-in" action); complete/no_show/
// cancelled are terminal, so the select just shows the current value with
// nothing else to pick.
const NEXT_STATUS_OPTIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  confirmed: ["confirmed", "checked_in", "complete", "no_show", "cancelled"],
  checked_in: ["checked_in", "complete", "no_show", "cancelled"],
  complete: ["complete"],
  no_show: ["no_show"],
  cancelled: ["cancelled"],
};

const STATUS_ACTION: Partial<Record<AppointmentStatus, (formData: FormData) => Promise<void>>> = {
  checked_in: checkInAction,
  complete: markCompleteAction,
  no_show: markNoShowAction,
  cancelled: cancelAppointmentAction,
};

function AppointmentStatusSelect({ id, status }: { id: string; status: AppointmentStatus }) {
  const [pending, setPending] = useState(false);
  const options = NEXT_STATUS_OPTIONS[status];

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as AppointmentStatus;
    const action = next === status ? undefined : STATUS_ACTION[next];
    if (!action) return;
    setPending(true);
    const formData = new FormData();
    formData.set("id", id);
    await action(formData);
    setPending(false);
  }

  return (
    <select
      className="input"
      value={status}
      disabled={pending || options.length === 1}
      onChange={handleChange}
      style={{
        width: "auto",
        padding: "4px 22px 4px 10px",
        fontSize: 12,
        fontWeight: 600,
        borderRadius: 999,
        border: "none",
        background: STATUS_COLORS[status].bg,
        color: STATUS_COLORS[status].fg,
      }}
    >
      {options.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
    </select>
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
                      <AppointmentStatusSelect id={a.id} status={a.status} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end">
                        <Link href={`/dashboard/appointments/${a.id}`} className="text-indigo-600 text-[12.5px]">View</Link>
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
