import { getSessionProfile } from "@/lib/permissions";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getOrCreateDoctorProfile, getOrCreateSingleAppointmentType } from "@/lib/scheduling";
import ProfileCard from "./ProfileCard";

export default async function ProfilesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await getSessionProfile();
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name, role, title, avatar_url, bio, phone")
    .eq("practice_id", session.practiceId)
    .order("role", { ascending: false })
    .order("full_name");

  const admin = await createAdminClient();
  const { data: authList } = await admin.auth.admin.listUsers({ perPage: 200 });
  const emailById = new Map((authList?.users || []).map((u) => [u.id, u.email || ""]));

  const allMembers = members || [];
  const self = allMembers.find((m) => m.id === session.userId);
  const others = allMembers.filter((m) => m.id !== session.userId);

  let doctorData = null;
  if (session.isAdmin && self) {
    const doctorProfile = await getOrCreateDoctorProfile(supabase, session.practiceId, session.userId, self.full_name || "Doctor");
    const [{ data: availability }, appointmentType, { data: blackoutDates }] = await Promise.all([
      supabase.from("doctor_availability").select("weekday, start_time, end_time").eq("doctor_profile_id", doctorProfile.id).order("weekday"),
      getOrCreateSingleAppointmentType(supabase, session.practiceId, doctorProfile.id),
      supabase.from("blackout_dates").select("id, date, reason").eq("doctor_profile_id", doctorProfile.id).order("date"),
    ]);
    doctorData = {
      profile: doctorProfile,
      availability: (availability || []).map((a) => ({ weekday: a.weekday, startTime: a.start_time.slice(0, 5), endTime: a.end_time.slice(0, 5) })),
      appointmentType: { id: appointmentType.id, durationMinutes: appointmentType.duration_minutes, isTelehealth: appointmentType.is_telehealth },
      blackoutDates: blackoutDates || [],
    };
  }

  return (
    <div className="max-w-[1000px] mx-auto py-8 px-5">
      <h1 className="text-[24px] font-semibold mb-1">Profiles</h1>
      <p className="text-[14px] text-gray-600 mb-6">
        Everyone on the team — add your own photo, name, and a few basic details so people recognize you in chat. Title and role are set by an admin on the Team page.
      </p>

      {error && (
        <div className="mb-5 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
          {error}
        </div>
      )}

      {self && (
        <div className="mb-6">
          <ProfileCard
            member={self}
            email={emailById.get(self.id) || ""}
            isSelf
            roleLabel={self.role === "clinic_admin" || self.role === "super_admin" ? "Doctor / Admin" : "Staff"}
            doctorData={doctorData}
            fullWidth
          />
        </div>
      )}

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
        {others.map((m) => (
          <ProfileCard
            key={m.id}
            member={m}
            email={emailById.get(m.id) || ""}
            isSelf={false}
            roleLabel={m.role === "clinic_admin" || m.role === "super_admin" ? "Doctor / Admin" : "Staff"}
            doctorData={null}
            fullWidth={false}
          />
        ))}
      </div>
    </div>
  );
}
