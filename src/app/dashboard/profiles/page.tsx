import { getSessionProfile } from "@/lib/permissions";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getOrCreateDoctorProfile, getOrCreateSingleAppointmentType } from "@/lib/scheduling";
import ProfileCard from "./ProfileCard";

export default async function ProfilesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const session = await getSessionProfile();
  const supabase = await createClient();

  const { data: self } = await supabase
    .from("profiles")
    .select("id, full_name, role, title, avatar_url, bio, phone")
    .eq("id", session.userId)
    .single();

  const admin = await createAdminClient();
  const { data: authUser } = await admin.auth.admin.getUserById(session.userId);
  const email = authUser?.user?.email || "";

  let doctorData = null;
  if (session.isAdmin && self) {
    const doctorProfile = await getOrCreateDoctorProfile(supabase, session.practiceId, session.userId, self.full_name || "Doctor");
    const [{ data: availability }, appointmentType, { data: blackoutDates }, { data: emailConnection }] = await Promise.all([
      supabase.from("doctor_availability").select("weekday, start_time, end_time").eq("doctor_profile_id", doctorProfile.id).order("weekday"),
      getOrCreateSingleAppointmentType(supabase, session.practiceId, doctorProfile.id),
      supabase.from("blackout_dates").select("id, date, reason").eq("doctor_profile_id", doctorProfile.id).order("date"),
      supabase.from("email_connections").select("email_address").eq("doctor_profile_id", doctorProfile.id).maybeSingle(),
    ]);
    doctorData = {
      profile: doctorProfile,
      availability: (availability || []).map((a) => ({ weekday: a.weekday, startTime: a.start_time.slice(0, 5), endTime: a.end_time.slice(0, 5) })),
      appointmentType: { id: appointmentType.id, durationMinutes: appointmentType.duration_minutes, isTelehealth: appointmentType.is_telehealth },
      blackoutDates: blackoutDates || [],
      connectedEmail: emailConnection?.email_address || null,
    };
  }

  return (
    <div className="max-w-[1000px] mx-auto py-8 px-5">
      <h1 className="text-[24px] font-semibold mb-1">My Profile</h1>
      <p className="text-[14px] text-gray-600 mb-6">
        Your photo, name, and a few basic details so people recognize you in chat. Title and role are set by an admin on the Team page.
      </p>

      {error && (
        <div className="mb-5 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
          {error}
        </div>
      )}
      {saved && !error && (
        <div className="mb-5 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--success-bg)", color: "var(--success-green)" }}>
          Profile saved.
        </div>
      )}

      {self && (
        <ProfileCard
          member={self}
          email={email}
          isSelf
          roleLabel={self.role === "clinic_admin" || self.role === "super_admin" ? "Doctor / Admin" : "Staff"}
          doctorData={doctorData}
          justSaved={!!saved}
        />
      )}
    </div>
  );
}
