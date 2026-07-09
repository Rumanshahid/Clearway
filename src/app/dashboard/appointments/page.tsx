import Link from "next/link";
import { getSessionProfile } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import AppointmentsBoard, { type AppointmentRow } from "./AppointmentsBoard";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ doctor?: string }>;
}) {
  const { doctor: doctorParam } = await searchParams;
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

  const [{ data: allAppointments }, { data: types }] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, appointment_type_id, patient_full_name, reason_for_visit, status, start_at, end_at, is_telehealth")
      .eq("doctor_profile_id", selectedDoctorId)
      .order("start_at"),
    supabase.from("appointment_types").select("id, name").eq("doctor_profile_id", selectedDoctorId),
  ]);
  const typeNameById = new Map((types || []).map((t) => [t.id, t.name]));

  const appointments: AppointmentRow[] = (allAppointments || []).map((a) => ({
    ...a,
    typeName: typeNameById.get(a.appointment_type_id) || "—",
  }));

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

      <AppointmentsBoard appointments={appointments} todayIso={new Date().toISOString().slice(0, 10)} />
    </div>
  );
}
