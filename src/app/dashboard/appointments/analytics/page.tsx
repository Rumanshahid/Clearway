import Link from "next/link";
import { requireAdmin } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function AppointmentAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ doctor?: string }>;
}) {
  const { doctor: doctorParam } = await searchParams;
  const session = await requireAdmin();
  const supabase = await createClient();

  const { data: doctors } = await supabase.from("doctor_profiles").select("id, profile_id").eq("practice_id", session.practiceId);

  if (!doctors || doctors.length === 0) {
    return (
      <div className="max-w-[900px] mx-auto py-8 px-5">
        <h1 className="text-[24px] font-semibold mb-2">Appointment analytics</h1>
        <p className="text-[14px] text-gray-600">No scheduling profile has been set up yet.</p>
      </div>
    );
  }

  const { data: profileNames } = await supabase.from("profiles").select("id, full_name").in("id", doctors.map((d) => d.profile_id));
  const nameById = new Map((profileNames || []).map((p) => [p.id, p.full_name || "Doctor"]));
  const selectedDoctorId = doctorParam && doctors.some((d) => d.id === doctorParam) ? doctorParam : doctors[0].id;

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const { data: appointments } = await supabase
    .from("appointments")
    .select("status, is_new_patient, reason_for_visit, start_at, created_at")
    .eq("doctor_profile_id", selectedDoctorId)
    .gte("created_at", ninetyDaysAgo.toISOString());

  const rows = appointments || [];
  const total = rows.length;
  const cancelled = rows.filter((r) => r.status === "cancelled").length;
  const noShow = rows.filter((r) => r.status === "no_show").length;
  const newPatients = rows.filter((r) => r.is_new_patient).length;

  const reasonCounts = new Map<string, number>();
  for (const r of rows) {
    if (!r.reason_for_visit) continue;
    reasonCounts.set(r.reason_for_visit, (reasonCounts.get(r.reason_for_visit) || 0) + 1);
  }
  const topReasons = [...reasonCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const dayCounts = new Array(7).fill(0);
  const hourCounts = new Map<number, number>();
  let totalLeadDays = 0;
  let leadCount = 0;
  for (const r of rows) {
    const start = new Date(r.start_at);
    dayCounts[start.getUTCDay()]++;
    const hour = start.getUTCHours();
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);

    const created = new Date(r.created_at);
    const leadDays = (start.getTime() - created.getTime()) / (24 * 60 * 60 * 1000);
    if (leadDays >= 0) {
      totalLeadDays += leadDays;
      leadCount++;
    }
  }
  const busiestDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
  const busiestHourEntry = [...hourCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const avgLeadDays = leadCount > 0 ? (totalLeadDays / leadCount).toFixed(1) : null;

  const pct = (n: number) => (total > 0 ? `${Math.round((n / total) * 100)}%` : "—");

  return (
    <div className="max-w-[1000px] mx-auto py-8 px-5">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px] font-semibold">Appointment analytics</h1>
        {doctors.length > 1 && (
          <form className="flex gap-2">
            <select name="doctor" defaultValue={selectedDoctorId} className="input w-auto">
              {doctors.map((d) => <option key={d.id} value={d.id}>{nameById.get(d.profile_id)}</option>)}
            </select>
          </form>
        )}
      </div>
      <p className="text-[13px] text-gray-400 mb-6">Last 90 days · {total} booking{total === 1 ? "" : "s"}</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-1">Cancellation rate</div>
          <div className="text-[24px] font-light">{pct(cancelled)}</div>
        </div>
        <div className="card p-4">
          <div className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-1">No-show rate</div>
          <div className="text-[24px] font-light" style={{ color: "var(--danger-red)" }}>{pct(noShow)}</div>
        </div>
        <div className="card p-4">
          <div className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-1">New patients</div>
          <div className="text-[24px] font-light" style={{ color: "var(--indigo-600)" }}>{pct(newPatients)}</div>
        </div>
        <div className="card p-4">
          <div className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-1">Avg. booking lead time</div>
          <div className="text-[24px] font-light">{avgLeadDays !== null ? `${avgLeadDays}d` : "—"}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="card p-5">
          <div className="text-[13px] font-semibold mb-3">Busiest day / time</div>
          <p className="text-[13.5px] text-gray-600">
            {total > 0 ? (
              <>
                {WEEKDAY_NAMES[busiestDayIndex]}s, around{" "}
                {busiestHourEntry ? new Date(Date.UTC(2000, 0, 1, busiestHourEntry[0])).toLocaleTimeString("en-US", { hour: "numeric", timeZone: "UTC" }) : "—"}
              </>
            ) : (
              "Not enough data yet."
            )}
          </p>
        </div>
        <div className="card p-5">
          <div className="text-[13px] font-semibold mb-3">Most common visit reasons</div>
          {topReasons.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {topReasons.map(([reason, count]) => (
                <div key={reason} className="flex justify-between text-[13.5px]">
                  <span className="text-gray-600">{reason}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13.5px] text-gray-400">No visit reasons recorded yet.</p>
          )}
        </div>
      </div>

      <Link href="/dashboard/appointments" className="text-[13px] text-gray-500">← Back to appointments</Link>
    </div>
  );
}
