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

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ doctor?: string; year?: string; month?: string }>;
}) {
  const { doctor: doctorParam, year, month } = await searchParams;
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

  const now = new Date();
  const calYear = year ? Number(year) : now.getFullYear();
  const calMonth = month ? Number(month) : now.getMonth(); // 0-indexed

  const monthStart = new Date(Date.UTC(calYear, calMonth, 1));
  const monthEnd = new Date(Date.UTC(calYear, calMonth + 1, 0, 23, 59, 59));

  const [{ data: allAppointments }, { data: monthAppointments }, { data: types }] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, appointment_type_id, patient_full_name, reason_for_visit, status, start_at, end_at, is_telehealth")
      .eq("doctor_profile_id", selectedDoctorId)
      .order("start_at"),
    supabase
      .from("appointments")
      .select("start_at")
      .eq("doctor_profile_id", selectedDoctorId)
      .gte("start_at", monthStart.toISOString())
      .lte("start_at", monthEnd.toISOString()),
    supabase.from("appointment_types").select("id, name").eq("doctor_profile_id", selectedDoctorId),
  ]);
  const typeNameById = new Map((types || []).map((t) => [t.id, t.name]));

  const appointments = allAppointments || [];

  const countsByDay = new Map<string, number>();
  for (const a of monthAppointments || []) {
    const key = a.start_at.slice(0, 10);
    countsByDay.set(key, (countsByDay.get(key) || 0) + 1);
  }

  const doctorQuery = `doctor=${selectedDoctorId}`;

  return (
    <div className="max-w-[1300px] mx-auto py-8 px-5">
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
          {session.isAdmin && (
            <Link href={`/dashboard/appointments/analytics?${doctorQuery}`} className="text-[13px] text-indigo-600">Analytics →</Link>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <aside className="w-full lg:w-[280px] flex-shrink-0">
          <CalendarView year={calYear} month={calMonth} countsByDay={countsByDay} doctorQuery={doctorQuery} />
        </aside>

        <div className="flex-1 min-w-0 w-full">
          <div className="card overflow-hidden overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="text-left text-gray-400 text-[11px] uppercase tracking-wide" style={{ borderBottom: "1px solid var(--gray-200)" }}>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Patient</th>
                  <th className="px-5 py-3 font-semibold">Type</th>
                  <th className="px-5 py-3 font-semibold">Reason</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 && (
                  <tr><td className="px-5 py-10 text-center text-gray-400" colSpan={6}>No appointments yet.</td></tr>
                )}
                {appointments.map((a) => (
                  <tr key={a.id} style={{ borderBottom: "1px solid var(--gray-100)" }}>
                    <td className="px-5 py-3">
                      {new Date(a.start_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
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
      </div>
    </div>
  );
}

function CalendarView({
  year,
  month,
  countsByDay,
  doctorQuery,
}: {
  year: number;
  month: number;
  countsByDay: Map<string, number>;
  doctorQuery: string;
}) {
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const startWeekday = firstOfMonth.getUTCDay();
  const monthLabel = firstOfMonth.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const todayKey = new Date().toISOString().slice(0, 10);

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;

  const cells: (number | null)[] = [...Array(startWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <Link href={`/dashboard/appointments?${doctorQuery}&year=${prevYear}&month=${prevMonth}`} className="text-btn text-[13px] text-gray-500">← Prev</Link>
        <div className="text-[14px] font-semibold">{monthLabel}</div>
        <Link href={`/dashboard/appointments?${doctorQuery}&year=${nextYear}&month=${nextMonth}`} className="text-btn text-[13px] text-gray-500">Next →</Link>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-wide text-gray-400 mb-2">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const count = countsByDay.get(dateKey) || 0;
          const isToday = dateKey === todayKey;
          return (
            <div
              key={i}
              className="rounded-lg p-1.5 flex flex-col items-center gap-1"
              style={isToday ? { background: "#EEF0FF" } : undefined}
            >
              <span className="text-[13px]">{day}</span>
              {count > 0 && (
                <span className="status-pill" style={{ background: "var(--indigo-600)", color: "#fff", fontSize: 10, padding: "1px 7px" }}>
                  {count}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
