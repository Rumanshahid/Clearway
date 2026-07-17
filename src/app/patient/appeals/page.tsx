import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getPatientDoctors } from "@/lib/patientDoctors";
import { createPatientAppealRequestAction } from "./actions";

// Patient-facing appeal request -- only what a patient realistically has
// from their own EOB (claim number, date of service, denial reason), not
// the staff claim-appeal tool's CPT/ICD codes or internal assignment
// fields. See 0045_patient_pa_and_appeals.sql.
export default async function PatientAppealsPage({
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
    .from("patient_appeal_requests")
    .select("id, claim_number, denial_reason, status, created_at, doctor_profile_id")
    .eq("patient_account_id", user.id)
    .order("created_at", { ascending: false });

  const doctorIds = (requests || []).map((r) => r.doctor_profile_id);
  const { data: doctorNames } = doctorIds.length
    ? await admin.from("profiles").select("id, full_name").in("id", doctorIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const nameById = new Map((doctorNames || []).map((d) => [d.id, d.full_name || "Doctor"]));

  return (
    <div className="max-w-[720px] mx-auto px-5 sm:px-10 py-10">
      <h1 className="text-[20px] font-semibold mb-1">Claim Appeals</h1>
      <p className="text-[14px] text-gray-600 mb-6">
        Ask one of your allowed doctors to help you appeal a denied claim.
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
          <a href="/patient" className="text-indigo-600 font-medium">Dashboard</a> before requesting an appeal.
        </div>
      ) : (
        <form action={createPatientAppealRequestAction} className="card p-6 flex flex-col gap-4 mb-8">
          <div>
            <label className="label" htmlFor="doctor_profile_id">Doctor</label>
            <select className="input" id="doctor_profile_id" name="doctor_profile_id" required>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.name}{d.specialty ? ` — ${d.specialty}` : ""}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="claim_number">Claim number</label>
              <input className="input" id="claim_number" name="claim_number" />
            </div>
            <div>
              <label className="label" htmlFor="date_of_service">Date of service</label>
              <input className="input" id="date_of_service" name="date_of_service" type="date" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="denial_reason">Why was the claim denied?</label>
            <textarea className="input" id="denial_reason" name="denial_reason" rows={2} placeholder="Copy this from your Explanation of Benefits (EOB) if you have it" required />
          </div>
          <div>
            <label className="label" htmlFor="notes">Additional notes</label>
            <textarea className="input" id="notes" name="notes" rows={2} />
          </div>
          <button type="submit" className="btn btn-primary self-start">Send request →</button>
        </form>
      )}

      <h2 className="text-[14px] font-semibold text-gray-900 mb-3">Your requests</h2>
      <div className="flex flex-col gap-3">
        {(requests || []).map((r) => (
          <div key={r.id} className="card p-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-[13.5px] font-medium text-gray-900">{r.claim_number || "Claim appeal"}</div>
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
