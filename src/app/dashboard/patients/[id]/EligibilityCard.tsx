"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { ELIGIBILITY_STATUSES, ELIGIBILITY_METHODS, isEligibilityStale } from "@/lib/eligibility";
import { logEligibilityCheckAction, deleteEligibilityCheckAction } from "../eligibility-actions";

export interface EligibilityCheckRow {
  id: string;
  checked_at: string;
  payer: string | null;
  member_id: string | null;
  plan_type: string | null;
  status: string;
  method: string;
  deductible_remaining: number | null;
  copay_amount: number | null;
  notes: string | null;
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  Active: { bg: "var(--success-bg)", color: "var(--success-green)" },
  Inactive: { bg: "var(--danger-bg)", color: "var(--danger-red)" },
  Unknown: { bg: "var(--gray-100)", color: "var(--gray-600)" },
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>
      {pending ? "Saving…" : "Log check"}
    </button>
  );
}

export default function EligibilityCard({
  patientId,
  checks,
  defaultPayer,
  defaultMemberId,
  defaultPlanType,
}: {
  patientId: string;
  checks: EligibilityCheckRow[];
  defaultPayer?: string | null;
  defaultMemberId?: string | null;
  defaultPlanType?: string | null;
}) {
  const [showForm, setShowForm] = useState(checks.length === 0);
  const latest = checks[0];
  const stale = isEligibilityStale(latest?.checked_at);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-semibold">Insurance Eligibility</h2>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "Log a check"}
        </button>
      </div>

      {latest ? (
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span className="status-pill" style={STATUS_STYLE[latest.status] || STATUS_STYLE.Unknown}>
            {latest.status}
          </span>
          <span className="text-[12.5px] text-gray-400">
            Checked {new Date(latest.checked_at).toLocaleDateString()} via {latest.method}
          </span>
          {stale && (
            <span className="status-pill" style={{ background: "var(--amber-bg)", color: "var(--amber)" }}>
              Stale — verify again before filing
            </span>
          )}
        </div>
      ) : (
        <p className="text-[13px] text-gray-400 mb-4">No eligibility check logged yet.</p>
      )}

      {showForm && (
        <form
          action={async (formData) => {
            await logEligibilityCheckAction(formData);
            setShowForm(false);
          }}
          className="flex flex-col gap-3 mb-6 border rounded-[12px] p-4"
          style={{ borderColor: "var(--gray-200)" }}
        >
          <input type="hidden" name="patient_id" value={patientId} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="elig_status">Status <span style={{ color: "var(--danger-red)" }}>*</span></label>
              <select className="input" id="elig_status" name="status" required defaultValue="">
                <option value="" disabled>Select…</option>
                {ELIGIBILITY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="elig_method">Verified via</label>
              <select className="input" id="elig_method" name="method" defaultValue="Payer portal">
                {ELIGIBILITY_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="elig_payer">Payer</label>
              <input className="input" id="elig_payer" name="payer" defaultValue={defaultPayer || ""} />
            </div>
            <div>
              <label className="label" htmlFor="elig_member_id">Member ID</label>
              <input className="input" id="elig_member_id" name="member_id" defaultValue={defaultMemberId || ""} />
            </div>
            <div>
              <label className="label" htmlFor="elig_plan_type">Plan type</label>
              <input className="input" id="elig_plan_type" name="plan_type" defaultValue={defaultPlanType || ""} />
            </div>
            <div>
              <label className="label" htmlFor="elig_deductible">Deductible remaining</label>
              <input className="input" id="elig_deductible" name="deductible_remaining" type="number" step="0.01" />
            </div>
            <div>
              <label className="label" htmlFor="elig_copay">Copay amount</label>
              <input className="input" id="elig_copay" name="copay_amount" type="number" step="0.01" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="elig_notes">Notes</label>
            <textarea className="input" id="elig_notes" name="notes" rows={2} />
          </div>
          <SubmitButton />
        </form>
      )}

      {checks.length > 0 && (
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-gray-400 text-[11px] uppercase tracking-wide" style={{ borderBottom: "1px solid var(--gray-200)" }}>
              <th className="py-2 font-semibold">Date</th>
              <th className="py-2 font-semibold">Status</th>
              <th className="py-2 font-semibold">Method</th>
              <th className="py-2 font-semibold">Deductible</th>
              <th className="py-2 font-semibold">Copay</th>
              <th className="py-2 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {checks.map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid var(--gray-100)" }}>
                <td className="py-2 text-gray-600">{new Date(c.checked_at).toLocaleDateString()}</td>
                <td className="py-2 text-gray-600">{c.status}</td>
                <td className="py-2 text-gray-600">{c.method}</td>
                <td className="py-2 text-gray-600">{c.deductible_remaining != null ? `$${c.deductible_remaining}` : "—"}</td>
                <td className="py-2 text-gray-600">{c.copay_amount != null ? `$${c.copay_amount}` : "—"}</td>
                <td className="py-2">
                  <form action={deleteEligibilityCheckAction}>
                    <input type="hidden" name="check_id" value={c.id} />
                    <input type="hidden" name="patient_id" value={patientId} />
                    <button type="submit" className="text-btn text-gray-400 hover:text-[var(--danger-red)]" title="Delete this check">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path d="M3 4.5h10M6.5 4.5V3a1 1 0 011-1h1a1 1 0 011 1v1.5M4.5 4.5V13a1 1 0 001 1h5a1 1 0 001-1V4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
