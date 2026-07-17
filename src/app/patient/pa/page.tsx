import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getPatientDoctors } from "@/lib/patientDoctors";
import { createPatientPaRequestAction } from "./actions";

// "PA by patient" -- a deliberately simple request form (doctor + what's
// needed + notes), not the staff clinical PA-drafting tool (which needs
// ICD-10/CPT codes, payer criteria, and a practice_id a patient_accounts
// identity doesn't have). See 0045_patient_pa_and_appeals.sql.
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

  const { data: account } = await supabase.from("patient_accounts").select("email").eq("id", user.id).single();
  if (!account) redirect("/dashboard");

  const admin = await createAdminClient();
  const doctors = (await getPatientDoctors(admin, user.id, account.email)).filter((d) => d.accessGranted);

  const { data: requests } = await supabase
    .from("patient_pa_requests")
    .select("id, procedure_description, notes, status, created_at, doctor_profile_id")
    .eq("patient_account_id", user.id)
    .order("created_at", { ascending: false });

  const doctorIds = (requests || []).map((r) => r.doctor_profile_id);
  const { data: doctorNames } = doctorIds.length
    ? await admin.from("profiles").select("id, full_name").in("id", doctorIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const nameById = new Map((doctorNames || []).map((d) => [d.id, d.full_name || "Doctor"]));

  return (
    <div className="max-w-[720px] mx-auto px-5 sm:px-10 py-10">
      <h1 className="text-[20px] font-semibold mb-1">Prior Authorization</h1>
      <p className="text-[14px] text-gray-600 mb-6">
        Ask one of your allowed doctors to start a prior authorization for something you need.
      </p>

      {error && (
        <div className="mb-4 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
          {error}
        </div>
      )}
      {submitted && (
        <div className="mb-4 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--success-bg)", color: "var(--success-green)" }}>
          Request sent — your doctor&apos;s office will follow up.
        </div>
      )}

      {doctors.length === 0 ? (
        <div className="card p-6 text-[13.5px] text-gray-500">
          You don&apos;t have any allowed doctors yet. Grant a doctor access from your{" "}
          <a href="/patient" className="text-indigo-600 font-medium">Dashboard</a> before requesting a prior authorization.
        </div>
      ) : (
        <form action={createPatientPaRequestAction} className="card p-6 flex flex-col gap-4 mb-8">
          <div>
            <label className="label" htmlFor="doctor_profile_id">Doctor</label>
            <select className="input" id="doctor_profile_id" name="doctor_profile_id" required>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.name}{d.specialty ? ` — ${d.specialty}` : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="procedure_description">What do you need authorized?</label>
            <input className="input" id="procedure_description" name="procedure_description" placeholder="e.g. MRI of the right knee" required />
          </div>
          <div>
            <label className="label" htmlFor="notes">Additional notes</label>
            <textarea className="input" id="notes" name="notes" rows={3} />
          </div>
          <button type="submit" className="btn btn-primary self-start">Send request →</button>
        </form>
      )}

      <h2 className="text-[14px] font-semibold text-gray-900 mb-3">Your requests</h2>
      <div className="flex flex-col gap-3">
        {(requests || []).map((r) => (
          <div key={r.id} className="card p-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-[13.5px] font-medium text-gray-900">{r.procedure_description}</div>
              <div className="text-[12px] text-gray-500">{nameById.get(r.doctor_profile_id) || "Doctor"} · {new Date(r.created_at).toLocaleDateString()}</div>
            </div>
            <span className="status-pill" style={{ background: "var(--gray-100)", color: "var(--gray-600)" }}>{r.status.replace("_", " ")}</span>
          </div>
        ))}
        {(!requests || requests.length === 0) && <p className="text-[13.5px] text-gray-400">No requests yet.</p>}
      </div>
    </div>
  );
}
