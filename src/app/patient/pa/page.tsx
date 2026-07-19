import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import NewPaRequestButton from "./NewPaRequestButton";
import PatientPaRequestRow from "./PatientPaRequestRow";
import RequestFiltersDropdown from "../RequestFiltersDropdown";
import type { DoctorOption } from "./PatientPaForm";

const STATUS_OPTIONS: [string, string][] = [
  ["draft", "Draft"],
  ["submitted", "Submitted"],
];

export default async function PatientPaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; submitted?: string; status?: string; doctor?: string; from?: string; to?: string }>;
}) {
  const { error, submitted, status, doctor, from, to } = await searchParams;
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

  let query = admin
    .from("patient_pa_requests")
    .select("id, procedure_description, status, doctor_profile_id, created_at, letter_content")
    .eq("patient_account_id", user.id)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status as "draft" | "submitted" | "in_review" | "resolved");
  if (doctor) query = query.eq("doctor_profile_id", doctor);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", `${to}T23:59:59`);

  const { data: requests } = await query;

  return (
    <div className="max-w-[1300px] mx-auto py-8 px-5">
      <div className="flex items-start justify-between gap-4 mb-1">
        <h1 className="text-[24px] font-semibold">Prior Authorization</h1>
        <NewPaRequestButton doctors={doctors} />
      </div>
      <p className="text-[13.5px] text-gray-600 mb-6">Submit a prior-authorization request directly to your doctor.</p>

      {submitted && !error && (
        <div className="mb-6 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--success-bg)", color: "var(--success-green)" }}>
          Request submitted — see it in the table below.
        </div>
      )}
      {error && (
        <div className="mb-6 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <RequestFiltersDropdown
          basePath="/patient/pa"
          status={status}
          doctor={doctor}
          from={from}
          to={to}
          statusOptions={STATUS_OPTIONS}
          doctorOptions={doctors.map((d) => [d.profileId, d.name])}
        />

        <div className="flex-1 min-w-0 w-full">
          <div className="card overflow-hidden overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="text-left text-gray-400 text-[11px] uppercase tracking-wide" style={{ borderBottom: "1px solid var(--gray-200)" }}>
                  <th className="px-5 py-3 font-semibold">Doctor</th>
                  <th className="px-5 py-3 font-semibold">Procedure</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Created</th>
                  <th className="px-5 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {requests && requests.length > 0 ? (
                  requests.map((r) => (
                    <PatientPaRequestRow
                      key={r.id}
                      requestId={r.id}
                      doctorName={nameById.get(r.doctor_profile_id) || "Doctor"}
                      procedureDescription={r.procedure_description}
                      status={r.status}
                      createdAt={r.created_at}
                      hasLetter={!!r.letter_content}
                    />
                  ))
                ) : (
                  <tr>
                    <td className="px-5 py-10 text-center text-gray-400" colSpan={5}>
                      No requests yet. Click &quot;+ New request&quot; to submit one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
