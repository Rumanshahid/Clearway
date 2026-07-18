import { createAdminClient } from "@/lib/supabase/server";

// Appointments have no FK to patient_accounts -- booking only ever collects
// a free-text patient_email, so matching on that (case-insensitive) is the
// only way to connect "my appointments" to the signed-in patient. Admin
// client throughout: appointments RLS is practice-staff-only (no patient
// policy), and profiles has no public-select policy either.
export default async function RecentAppointmentsWidget({ email }: { email: string }) {
  const admin = await createAdminClient();

  const { data: appointments } = await admin
    .from("appointments")
    .select("id, doctor_profile_id, reason_for_visit, start_at, status")
    .ilike("patient_email", email)
    .order("start_at", { ascending: false })
    .limit(5);

  const doctorIds = [...new Set((appointments || []).map((a) => a.doctor_profile_id))];
  const { data: profileRows } = doctorIds.length
    ? await admin.from("profiles").select("id, full_name").in("id", doctorIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const nameById = new Map((profileRows || []).map((p) => [p.id, p.full_name || "Doctor"]));

  return (
    <div className="card p-5">
      <h2 className="text-[13.5px] font-semibold mb-3">Recent Appointments</h2>
      {appointments && appointments.length > 0 ? (
        <div className="flex flex-col gap-3">
          {appointments.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-3" style={{ fontSize: 12.5 }}>
              <div className="min-w-0">
                <div className="font-medium text-gray-900 truncate">{nameById.get(a.doctor_profile_id) || "Doctor"}</div>
                <div className="text-gray-500 truncate">{a.reason_for_visit || "Visit"}</div>
              </div>
              <div className="text-right text-gray-400 flex-shrink-0">
                {new Date(a.start_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                <br />
                {new Date(a.start_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400" style={{ fontSize: 12.5 }}>No appointments yet.</p>
      )}
    </div>
  );
}
