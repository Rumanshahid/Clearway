import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import PatientPaForm, { type DoctorOption } from "./PatientPaForm";

export default async function PatientPaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; submitted?: string }>;
}) {
  const { error, submitted } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const admin = await createAdminClient();
  const { data: account } = await admin.from("patient_accounts").select("id").eq("id", user.id).maybeSingle();
  if (!account) redirect("/auth/choose-role");

  // Anonymous-safe admin client, same pattern as /doctors: doctor_profiles
  // has no public-select RLS policy, and profiles.full_name isn't
  // patient-readable via RLS either.
  const { data: doctorRows } = await admin.from("doctor_profiles").select("profile_id, specialty").eq("public_enabled", true);
  const profileIds = (doctorRows || []).map((d) => d.profile_id);
  const { data: profileRows } = profileIds.length
    ? await admin.from("profiles").select("id, full_name").in("id", profileIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const nameById = new Map((profileRows || []).map((p) => [p.id, p.full_name || "Doctor"]));
  const doctors: DoctorOption[] = (doctorRows || []).map((d) => ({
    profileId: d.profile_id,
    name: nameById.get(d.profile_id) || "Doctor",
    specialty: d.specialty,
  }));

  const { data: requests } = await admin
    .from("patient_pa_requests")
    .select("id, procedure_description, status, doctor_profile_id, created_at")
    .eq("patient_account_id", user.id)
    .order("created_at", { ascending: false });

  const requestDoctorIds = [...new Set((requests || []).map((r) => r.doctor_profile_id))];
  const { data: requestDoctorProfiles } = requestDoctorIds.length
    ? await admin.from("profiles").select("id, full_name").in("id", requestDoctorIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const requestDoctorNameById = new Map((requestDoctorProfiles || []).map((p) => [p.id, p.full_name || "Doctor"]));

  return (
    <div className="max-w-[700px] mx-auto py-8 px-5">
      <h1 className="text-[24px] font-semibold mb-1">Prior Authorization</h1>
      <p className="text-[13.5px] text-gray-600 mb-6">Submit a prior-authorization request directly to your doctor.</p>

      {submitted && (
        <div className="mb-4 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--success-bg)", color: "var(--success-green)" }}>
          Request submitted.
        </div>
      )}
      {error && (
        <div className="mb-4 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
          {error}
        </div>
      )}

      <div className="mb-6">
        <PatientPaForm doctors={doctors} />
      </div>

      <h2 className="text-[15px] font-semibold mb-3">Your requests</h2>
      {requests && requests.length > 0 ? (
        <div className="flex flex-col gap-3">
          {requests.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[13.5px] font-medium">{requestDoctorNameById.get(r.doctor_profile_id) || "Doctor"}</span>
                <span className="text-[12px] text-gray-400 capitalize">{r.status.replace("_", " ")}</span>
              </div>
              <p className="text-[13px] text-gray-600">{r.procedure_description}</p>
              <p className="text-[11.5px] text-gray-400 mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-[13.5px]">No requests yet.</p>
      )}
    </div>
  );
}
