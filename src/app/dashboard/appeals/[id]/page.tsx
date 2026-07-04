import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDenialRouting } from "@/lib/claims";
import ClaimLetterPanel from "./ClaimLetterPanel";
import { updateDenialStatusAction, redraftClaimAppealAction } from "./actions";
import DeleteDenialButton from "./DeleteDenialButton";

export const maxDuration = 60;

export default async function ClaimDenialDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: denial } = await supabase.from("claim_denials").select("*").eq("id", id).single();
  if (!denial) notFound();

  const { data: patient } = denial.patient_id
    ? await supabase.from("patients").select("first_name, last_name, patient_ref_id").eq("id", denial.patient_id).single()
    : { data: null };

  const [{ data: staff }, { data: assignedStaff }] = await Promise.all([
    supabase.from("profiles").select("id, full_name").eq("practice_id", denial.practice_id).order("full_name"),
    denial.assigned_to
      ? supabase.from("profiles").select("full_name").eq("id", denial.assigned_to).single()
      : Promise.resolve({ data: null }),
  ]);

  const { data: letters } = await supabase
    .from("claim_appeal_letters")
    .select("*")
    .eq("claim_denial_id", id)
    .order("version", { ascending: false })
    .limit(1);

  const letter = letters?.[0];
  const routing = getDenialRouting(denial.denial_reason_code);

  const now = new Date();
  const daysUntil = denial.appeal_deadline ? Math.ceil((new Date(denial.appeal_deadline).getTime() - now.getTime()) / 86400000) : null;

  return (
    <div className="max-w-[900px] mx-auto py-8 px-5">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-[24px] font-semibold">
          {patient ? `${patient.first_name} ${patient.last_name}` : "Claim denial"} — {denial.claim_number || "no claim #"}
        </h1>
        <span className="status-pill capitalize" style={{ background: "var(--gray-100)", color: "var(--gray-600)" }}>
          {denial.status.replace("_", " ")}
        </span>
      </div>
      <p className="text-[13.5px] text-gray-600 mb-6">{routing.reason} ({denial.denial_reason_code}) — {routing.letterType}</p>

      {error && (
        <div className="mb-5 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
          {error}
        </div>
      )}

      {daysUntil !== null && (
        <div
          className="mb-6 text-[13.5px] rounded-lg px-4 py-3 font-semibold"
          style={
            daysUntil < 0
              ? { background: "var(--danger-bg)", color: "var(--danger-red)" }
              : daysUntil <= 7
              ? { background: "var(--amber-bg)", color: "var(--amber)" }
              : { background: "var(--gray-100)", color: "var(--gray-600)" }
          }
        >
          {daysUntil < 0
            ? `Appeal deadline passed ${Math.abs(daysUntil)} days ago — consider external review.`
            : `${daysUntil} days remaining to appeal (deadline ${denial.appeal_deadline}).`}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card p-6">
          <h2 className="text-[15px] font-semibold mb-4">Claim identity</h2>
          <dl className="grid grid-cols-2 gap-3 text-[13.5px]">
            <Field label="Date of service" value={denial.date_of_service} />
            <Field label="CPT code" value={denial.cpt_code} />
            <Field label="ICD-10 code" value={denial.icd10_code} />
            <Field label="Amount billed" value={denial.amount_billed != null ? `$${denial.amount_billed}` : null} />
            <Field label="Amount denied" value={denial.amount_denied != null ? `$${denial.amount_denied}` : null} />
            <Field label="Payer claim ref" value={denial.payer_claim_reference} />
            <Field label="Payer" value={denial.payer} />
            <Field label="PA obtained" value={denial.pa_obtained} />
            <Field label="Assigned to" value={assignedStaff?.full_name || "Unassigned"} />
          </dl>
        </div>

        <div className="card p-6">
          <h2 className="text-[15px] font-semibold mb-4">Update status</h2>
          <form action={updateDenialStatusAction} className="flex flex-col gap-3">
            <input type="hidden" name="denial_id" value={denial.id} />
            <div>
              <label className="label" htmlFor="status">Status</label>
              <select className="input" id="status" name="status" defaultValue={denial.status}>
                <option value="open">Open</option>
                <option value="appeal_filed">Appeal filed</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="recovered_amount">Recovered amount (if won)</label>
              <input className="input" id="recovered_amount" name="recovered_amount" type="number" step="0.01" defaultValue={denial.amount_recovered ?? ""} />
            </div>
            <div>
              <label className="label" htmlFor="assigned_to">Assigned to</label>
              <select className="input" id="assigned_to" name="assigned_to" defaultValue={denial.assigned_to || ""}>
                <option value="">Unassigned</option>
                {(staff || []).map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name || "(unnamed staff)"}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary self-start" type="submit">Save status</button>
          </form>
        </div>
      </div>

      <DeleteDenialButton denialId={denial.id} />

      {letter ? (
        <>
          <ClaimLetterPanel
            letterId={letter.id}
            denialId={denial.id}
            content={letter.content}
            sections={letter.sections as never}
            meta={letter.meta}
            locked={denial.status === "won" || denial.status === "lost"}
          />
          <form action={redraftClaimAppealAction} className="mt-4">
            <input type="hidden" name="denial_id" value={denial.id} />
            <button className="btn btn-outline btn-sm" type="submit">Re-draft appeal letter</button>
          </form>
        </>
      ) : (
        <div className="card p-6 text-center text-gray-400">
          No appeal letter drafted yet.
          <form action={redraftClaimAppealAction} className="mt-3">
            <input type="hidden" name="denial_id" value={denial.id} />
            <button className="btn btn-primary btn-sm" type="submit">Draft appeal letter</button>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-1">{label}</dt>
      <dd className="text-gray-900">{value ?? "—"}</dd>
    </div>
  );
}
