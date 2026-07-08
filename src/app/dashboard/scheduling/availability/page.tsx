import { requireAdmin } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateDoctorProfile } from "@/lib/scheduling";
import AvailabilityClient from "./AvailabilityClient";

export default async function AvailabilityPage() {
  const session = await requireAdmin();
  const supabase = await createClient();

  const { data: myProfile } = await supabase.from("profiles").select("full_name").eq("id", session.userId).single();
  const doctor = await getOrCreateDoctorProfile(supabase, session.practiceId, session.userId, myProfile?.full_name || "Doctor");

  const [{ data: blocks }, { data: blackouts }] = await Promise.all([
    supabase.from("doctor_availability").select("weekday, start_time, end_time").eq("doctor_profile_id", doctor.id).order("weekday"),
    supabase.from("blackout_dates").select("id, date, reason").eq("doctor_profile_id", doctor.id).order("date"),
  ]);

  return (
    <AvailabilityClient
      doctorProfileId={doctor.id}
      initialBlocks={(blocks || []).map((b) => ({ weekday: b.weekday, start_time: b.start_time.slice(0, 5), end_time: b.end_time.slice(0, 5) }))}
      timezone={doctor.timezone}
      minNoticeHours={doctor.min_notice_hours}
      maxAdvanceDays={doctor.max_advance_days}
      maxAppointmentsPerDay={doctor.max_appointments_per_day}
      blackoutDates={blackouts || []}
    />
  );
}
