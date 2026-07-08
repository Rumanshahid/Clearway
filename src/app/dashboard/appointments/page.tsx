import Link from "next/link";
import { getSessionProfile } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import type { AppointmentStatus } from "@/lib/database.types";
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

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ doctor?: string; date?: string; view?: string; year?: string; month?: string }>;
}) {
  const { doctor: doctorParam, date, view, year, month } = await searchParams;
  const session = await getSessionProfile();
  const supabase = await createClient();

  const { data: doctors } = await supabase
    .from("doctor_profiles")
    .select("id, profile_id, credentials, specialty")
    .eq("practice_id", session.practiceId);

  if (!doctors || doctors.length === 0) {
    return (
      <div className="max-w-[900px] mx-auto py-8 px-5">
        <h1 className="text-[24px] font-semibold mb-2">Appointments</h1>
        <p className="text-[14px] text-gray-600">
          No scheduling profile has been set up yet.{" "}
          {session.isAdmin && (
            <Link href="/dashboard/profiles" className="text-indigo-600">Set it up on your Profile →</Link>
          )}
        </p>
      </div>
    );
  }

  const { data: profileNames } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", doctors.map((d) => d.profile_id));
  const nameById = new Map((profileNames || []).map((p) => [p.id, p.full_name || "Doctor"]));

  const selectedDoctorId =
    doctorParam && doctors.some((d) => d.id === doctorParam)
      ? doctorParam
      : doctors.find((d) => d.profile_id === session.userId)?.id || doctors[0].id;

  const activeView = view === "calendar" ? "calendar" : "list";
  const selectedDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayKey();
  const now = new Date();
  const calYear = year ? Number(year) : now.getFullYear();
  const calMonth = month ? Number(month) : now.getMonth(); // 0-indexed

  const monthStart = new Date(Date.UTC(calYear, calMonth, 1));
  const monthEnd = new Date(Date.UTC(calYear, calMonth + 1, 0, 23, 59, 59));

  const { data: monthAppointments } = await supabase
    .from("appointments")
    .select("id, appointment_type_id, patient_full_name, reason_for_visit, status, start_at, end_at, is_telehealth")
    .eq("doctor_profile_id", selectedDoctorId)
    .gte("start_at", monthStart.toISOString())
    .lte("start_at", monthEnd.toISOString())
    .order("start_at");

  const { data: types } = await supabase
    .from("appointment_types")
    .select("id, name")
    .eq("doctor_profile_id", selectedDoctorId);
  const typeNameById = new Map((types || []).map((t) => [t.id, t.name]));

  const appointments = monthAppointments || [];
  const dayAppointments = appointments.filter((a) => a.start_at.slice(0, 10) === selectedDate);

  const countsByDay = new Map<string, number>();
  for (const a of appointments) {
    const key = a.start_at.slice(0, 10);
    countsByDay.set(key, (countsByDay.get(key) || 0) + 1);
  }

  const doctorQuery = `doctor=${selectedDoctorId}`;

  return (
    <div className="max-w-[1100px] mx-auto py-8 px-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-[24px] font-semibold">Appointments</h1>
        <div className="flex items-center gap-3">
          {doctors.length > 1 && (
            <form>
              <select
                name="doctor"
                defaultValue={selectedDoctorId}
                className="input"
                // Plain GET form -- no client JS needed to switch doctors.
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{nameById.get(d.profile_id)}</option>
                ))}
              </select>
            </form>
          )}
          <div className="flex gap-1 card p-1">
            <Link href={`/dashboard/appointments?${doctorQuery}&view=list&date=${selectedDate}`} className={`px-3 py-1.5 rounded-md text-[13px] ${activeView === "list" ? "font-semibold" : "text-gray-500"}`} style={activeView === "list" ? { background: "var(--gray-100)" } : undefined}>
              List
            </Link>
            <Link href={`/dashboard/appointments?${doctorQuery}&view=calendar&year=${calYear}&month=${calMonth}`} className={`px-3 py-1.5 rounded-md text-[13px] ${activeView === "calendar" ? "font-semibold" : "text-gray-500"}`} style={activeView === "calendar" ? { background: "var(--gray-100)" } : undefined}>
              Calendar
            </Link>
          </div>
          {session.isAdmin && (
            <Link href={`/dashboard/appointments/analytics?${doctorQuery}`} className="text-[13px] text-indigo-600">Analytics →</Link>
          )}
        </div>
      </div>

      {activeView === "calendar" ? (
        <CalendarView
          year={calYear}
          month={calMonth}
          countsByDay={countsByDay}
          doctorQuery={doctorQuery}
          selectedDate={selectedDate}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Link href={`/dashboard/appointments?${doctorQuery}&view=list&date=${shiftDate(selectedDate, -1)}`} className="text-btn text-[13px] text-gray-500">← Previous day</Link>
            <div className="text-[14px] font-semibold">{formatDateLabel(selectedDate)}</div>
            <Link href={`/dashboard/appointments?${doctorQuery}&view=list&date=${shiftDate(selectedDate, 1)}`} className="text-btn text-[13px] text-gray-500">Next day →</Link>
          </div>

          <div className="card overflow-hidden overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="text-left text-gray-400 text-[11px] uppercase tracking-wide" style={{ borderBottom: "1px solid var(--gray-200)" }}>
                  <th className="px-5 py-3 font-semibold">Time</th>
                  <th className="px-5 py-3 font-semibold">Patient</th>
                  <th className="px-5 py-3 font-semibold">Type</th>
                  <th className="px-5 py-3 font-semibold">Reason</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {dayAppointments.length === 0 && (
                  <tr><td className="px-5 py-10 text-center text-gray-400" colSpan={6}>No appointments this day.</td></tr>
                )}
                {dayAppointments.map((a) => (
                  <tr key={a.id} style={{ borderBottom: "1px solid var(--gray-100)" }}>
                    <td className="px-5 py-3">
                      {new Date(a.start_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      {a.is_telehealth && <span className="text-gray-400"> · Telehealth</span>}
                    </td>
                    <td className="px-5 py-3">{a.patient_full_name}</td>
                    <td className="px-5 py-3 text-gray-600">{typeNameById.get(a.appointment_type_id) || "—"}</td>
                    <td className="px-5 py-3 text-gray-600">{a.reason_for_visit || "—"}</td>
                    <td className="px-5 py-3">
                      <span className="status-pill" style={{ background: STATUS_COLORS[a.status].bg, color: STATUS_COLORS[a.status].fg }}>
                        {STATUS_LABELS[a.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3 justify-end">
                        <Link href={`/dashboard/appointments/${a.id}`} className="text-indigo-600 text-[12.5px]">View</Link>
                        {(a.status === "confirmed" || a.status === "checked_in") && (
                          <>
                            {a.status === "confirmed" && (
                              <form action={checkInAction}>
                                <input type="hidden" name="id" value={a.id} />
                                <button type="submit" className="text-btn text-[12.5px] text-gray-500">Check In</button>
                              </form>
                            )}
                            <form action={markCompleteAction}>
                              <input type="hidden" name="id" value={a.id} />
                              <button type="submit" className="text-btn text-[12.5px] text-gray-500">Complete</button>
                            </form>
                            <form action={markNoShowAction}>
                              <input type="hidden" name="id" value={a.id} />
                              <button type="submit" className="text-btn text-[12.5px] text-gray-500">No-Show</button>
                            </form>
                            <form action={cancelAppointmentAction}>
                              <input type="hidden" name="id" value={a.id} />
                              <button type="submit" className="text-btn text-[12.5px] text-gray-400">Cancel</button>
                            </form>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function shiftDate(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDateLabel(dateKey: string): string {
  return new Date(`${dateKey}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function CalendarView({
  year,
  month,
  countsByDay,
  doctorQuery,
  selectedDate,
}: {
  year: number;
  month: number;
  countsByDay: Map<string, number>;
  doctorQuery: string;
  selectedDate: string;
}) {
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const startWeekday = firstOfMonth.getUTCDay();
  const monthLabel = firstOfMonth.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;

  const cells: (number | null)[] = [...Array(startWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <Link href={`/dashboard/appointments?${doctorQuery}&view=calendar&year=${prevYear}&month=${prevMonth}`} className="text-btn text-[13px] text-gray-500">← Prev</Link>
        <div className="text-[14px] font-semibold">{monthLabel}</div>
        <Link href={`/dashboard/appointments?${doctorQuery}&view=calendar&year=${nextYear}&month=${nextMonth}`} className="text-btn text-[13px] text-gray-500">Next →</Link>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-wide text-gray-400 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const count = countsByDay.get(dateKey) || 0;
          const isSelected = dateKey === selectedDate;
          return (
            <Link
              key={i}
              href={`/dashboard/appointments?${doctorQuery}&view=list&date=${dateKey}`}
              className="rounded-lg p-2 flex flex-col items-center gap-1 hover:bg-gray-50"
              style={isSelected ? { background: "#EEF0FF" } : undefined}
            >
              <span className="text-[13px]">{day}</span>
              {count > 0 && (
                <span className="status-pill" style={{ background: "var(--indigo-600)", color: "#fff", fontSize: 10, padding: "1px 7px" }}>
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
