"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { DENIAL_ROUTING, PA_OBTAINED_OPTIONS, APPEAL_TYPES, PRIORITIES, FILING_METHODS } from "@/lib/claims";
import { INSURANCE_COMPANIES, GENDERS } from "@/lib/patients";
import { createDenialAction } from "./actions";

interface SimplePatient {
  id: string;
  first_name: string;
  last_name: string;
}

interface SimplePaRequest {
  id: string;
  patient_reference: string;
  procedure_type: string;
  patient_id: string | null;
}

interface SimpleStaff {
  id: string;
  full_name: string | null;
}

interface EobExtraction {
  claimNumber?: string;
  denialDate?: string;
  denialReasonCode?: string;
  denialReasonDescription?: string;
  amountBilled?: number;
  amountDenied?: number;
  payerClaimReference?: string;
  memberId?: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary w-full justify-center" type="submit" disabled={pending}>
      {pending ? "Logging denial and drafting appeal… (can take up to a minute)" : "Log denial & draft appeal →"}
    </button>
  );
}

export default function ClaimDenialForm({
  patients,
  paRequests,
  staff,
}: {
  patients: SimplePatient[];
  paRequests: SimplePaRequest[];
  staff: SimpleStaff[];
}) {
  const [patientMode, setPatientMode] = useState<"select" | "new">(patients.length > 0 ? "select" : "new");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [linkToPa, setLinkToPa] = useState(false);
  const [denialCode, setDenialCode] = useState(DENIAL_ROUTING[0].code);
  const [denialDate, setDenialDate] = useState("");
  const [payer, setPayer] = useState("");
  const [claimNumber, setClaimNumber] = useState("");
  const [amountBilled, setAmountBilled] = useState("");
  const [amountDenied, setAmountDenied] = useState("");
  const [payerClaimReference, setPayerClaimReference] = useState("");
  const [denialReasonDescription, setDenialReasonDescription] = useState("");

  const [eobFile, setEobFile] = useState<File | null>(null);
  const [eobParsing, setEobParsing] = useState(false);
  const [eobError, setEobError] = useState<string | null>(null);
  const [eobMemberIdHint, setEobMemberIdHint] = useState<string | null>(null);

  const routing = useMemo(() => DENIAL_ROUTING.find((d) => d.code === denialCode) || DENIAL_ROUTING[0], [denialCode]);
  const patientPaRequests = useMemo(
    () => paRequests.filter((r) => r.patient_id === selectedPatientId),
    [paRequests, selectedPatientId]
  );

  async function handleParseEob() {
    if (!eobFile) return;
    setEobParsing(true);
    setEobError(null);
    try {
      const formData = new FormData();
      formData.append("file", eobFile);
      const res = await fetch("/api/appeals/parse-eob", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not read this EOB");

      const extracted = data as EobExtraction;
      if (extracted.claimNumber) setClaimNumber(extracted.claimNumber);
      if (extracted.denialDate) setDenialDate(extracted.denialDate);
      if (extracted.denialReasonCode && DENIAL_ROUTING.some((d) => d.code === extracted.denialReasonCode)) {
        setDenialCode(extracted.denialReasonCode);
      }
      if (extracted.denialReasonDescription) setDenialReasonDescription(extracted.denialReasonDescription);
      if (extracted.amountBilled != null) setAmountBilled(String(extracted.amountBilled));
      if (extracted.amountDenied != null) setAmountDenied(String(extracted.amountDenied));
      if (extracted.payerClaimReference) setPayerClaimReference(extracted.payerClaimReference);
      if (extracted.memberId) setEobMemberIdHint(extracted.memberId);
    } catch (err) {
      setEobError(err instanceof Error ? err.message : "Could not read this EOB");
    } finally {
      setEobParsing(false);
    }
  }

  return (
    <form action={createDenialAction} className="flex flex-col gap-6">
      <section className="card p-6">
        <h2 className="text-[15px] font-semibold mb-1">Upload EOB (optional)</h2>
        <p className="text-[12.5px] text-gray-400 mb-3">Auto-fills the claim and denial fields below — review before submitting.</p>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setEobFile(e.target.files?.[0] || null)}
            className="text-[13px]"
          />
          <button type="button" className="btn btn-outline btn-sm" disabled={!eobFile || eobParsing} onClick={handleParseEob}>
            {eobParsing ? "Reading EOB…" : "Auto-fill from EOB"}
          </button>
        </div>
        {eobError && <p className="text-[12.5px] mt-2" style={{ color: "var(--danger-red)" }}>{eobError}</p>}
        {eobMemberIdHint && (
          <p className="text-[12.5px] mt-2" style={{ color: "var(--amber)" }}>
            EOB shows member ID <strong>{eobMemberIdHint}</strong> — confirm it matches the patient selected below.
          </p>
        )}
      </section>

      <section className="card p-6">
        <h2 className="text-[15px] font-semibold mb-4">Claim identity</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label mb-2">Patient <span style={{ color: "var(--danger-red)" }}>*</span></label>
            {patients.length > 0 && (
              <div className="flex gap-4 mb-2 text-[13px] text-gray-600">
                <label className="flex items-center gap-1.5">
                  <input type="radio" checked={patientMode === "select"} onChange={() => setPatientMode("select")} />
                  Existing patient
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="radio" checked={patientMode === "new"} onChange={() => setPatientMode("new")} />
                  Add new patient
                </label>
              </div>
            )}
            {patientMode === "select" && patients.length > 0 ? (
              <select
                className="input"
                name="patient_id"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                required
              >
                <option value="" disabled>Select…</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                ))}
              </select>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <input className="input" name="new_patient_first_name" placeholder="First name" required />
                <input className="input" name="new_patient_last_name" placeholder="Last name" required />
                <input className="input" name="new_patient_dob" type="date" required />
                <select className="input" name="new_patient_gender" defaultValue="" required>
                  <option value="" disabled>Gender…</option>
                  {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            )}
          </div>
          <div>
            <label className="label" htmlFor="date_of_service">Date of service</label>
            <input className="input" id="date_of_service" name="date_of_service" type="date" />
          </div>
          <div>
            <label className="label" htmlFor="claim_number">Claim number (from EOB)</label>
            <input className="input" id="claim_number" name="claim_number" value={claimNumber} onChange={(e) => setClaimNumber(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="cpt_code">Procedure (CPT code)</label>
            <input className="input" id="cpt_code" name="cpt_code" placeholder="e.g. 72148" />
          </div>
          <div>
            <label className="label" htmlFor="icd10_code">Diagnosis (ICD-10 code)</label>
            <input className="input" id="icd10_code" name="icd10_code" placeholder="e.g. M54.5" />
          </div>
          <div>
            <label className="label" htmlFor="amount_billed">Amount billed</label>
            <input className="input" id="amount_billed" name="amount_billed" type="number" step="0.01" value={amountBilled} onChange={(e) => setAmountBilled(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="amount_denied">Amount denied</label>
            <input className="input" id="amount_denied" name="amount_denied" type="number" step="0.01" value={amountDenied} onChange={(e) => setAmountDenied(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="date_submitted">Date claim originally submitted</label>
            <input className="input" id="date_submitted" name="date_submitted" type="date" />
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-[15px] font-semibold mb-4">Denial information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="denial_date">Denial date <span style={{ color: "var(--danger-red)" }}>*</span></label>
            <input className="input" id="denial_date" name="denial_date" type="date" required value={denialDate} onChange={(e) => setDenialDate(e.target.value)} />
            <p className="text-[12px] text-gray-400 mt-1">The appeal deadline is estimated from this date and the payer below.</p>
          </div>
          <div>
            <label className="label" htmlFor="payer">Payer</label>
            <select className="input" id="payer" name="payer" value={payer} onChange={(e) => setPayer(e.target.value)}>
              <option value="">Select…</option>
              {INSURANCE_COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label" htmlFor="denial_reason_code">Denial reason code <span style={{ color: "var(--danger-red)" }}>*</span></label>
            <select className="input" id="denial_reason_code" name="denial_reason_code" value={denialCode} onChange={(e) => setDenialCode(e.target.value)} required>
              {DENIAL_ROUTING.map((d) => (
                <option key={d.code} value={d.code}>{d.code} — {d.reason}</option>
              ))}
            </select>
            <p className="text-[12px] mt-1" style={{ color: routing.isAdminIssue ? "var(--amber)" : "var(--gray-400)" }}>
              {routing.isAdminIssue
                ? `Administrative issue — Asaanbil will draft a short ${routing.letterType.toLowerCase()}, not a clinical appeal.`
                : `Asaanbil will draft a ${routing.letterType.toLowerCase()}.`}
            </p>
          </div>
          <div className="col-span-2">
            <label className="label" htmlFor="denial_reason_description">Denial reason description (paste from EOB)</label>
            <textarea className="input" id="denial_reason_description" name="denial_reason_description" rows={2} value={denialReasonDescription} onChange={(e) => setDenialReasonDescription(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="payer_claim_reference">Payer claim reference number</label>
            <input className="input" id="payer_claim_reference" name="payer_claim_reference" value={payerClaimReference} onChange={(e) => setPayerClaimReference(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="pa_obtained">Was a prior authorization obtained?</label>
            <select className="input" id="pa_obtained" name="pa_obtained" defaultValue="">
              <option value="">Not specified</option>
              {PA_OBTAINED_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          {patientMode === "select" && patientPaRequests.length > 0 && (
            <div className="col-span-2">
              <label className="flex items-center gap-2 text-[13.5px] text-gray-900 mb-2">
                <input type="checkbox" className="w-4 h-4" checked={linkToPa} onChange={(e) => setLinkToPa(e.target.checked)} />
                This denial relates to a PA request already submitted in Asaanbil
              </label>
              {linkToPa && (
                <select className="input" name="pa_request_id" defaultValue="">
                  <option value="">Select the PA request…</option>
                  {patientPaRequests.map((r) => (
                    <option key={r.id} value={r.id}>{r.patient_reference} — {r.procedure_type}</option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-[15px] font-semibold mb-4">Appeal tracking</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="appeal_type">Appeal type needed</label>
            <select className="input" id="appeal_type" name="appeal_type" defaultValue="First-level internal">
              {APPEAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="priority">Priority</label>
            <select className="input" id="priority" name="priority" defaultValue="Standard">
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label" htmlFor="assigned_to">Assigned to</label>
            <select className="input" id="assigned_to" name="assigned_to" defaultValue="">
              <option value="">Unassigned</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name || "(unnamed staff)"}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-[15px] font-semibold mb-1">Appeal letter inputs</h2>
        <p className="text-[12.5px] text-gray-400 mb-4">Used to draft the appeal — the more specific, the stronger the letter.</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label" htmlFor="new_clinical_evidence">New clinical evidence not in the original claim</label>
            <textarea className="input" id="new_clinical_evidence" name="new_clinical_evidence" rows={2} />
          </div>
          <div className="col-span-2">
            <label className="label" htmlFor="supporting_documentation">Supporting documentation being attached</label>
            <input className="input" id="supporting_documentation" name="supporting_documentation" placeholder="e.g. operative notes, lab results, imaging report" />
          </div>
          <div>
            <label className="label" htmlFor="filing_method">Appeal filing method</label>
            <select className="input" id="filing_method" name="filing_method" defaultValue="">
              <option value="">Not specified</option>
              {FILING_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-[13.5px] text-gray-900 mt-6">
            <input type="checkbox" name="p2p_requested" className="w-4 h-4" />
            Requesting a peer-to-peer review simultaneously
          </label>
        </div>
      </section>

      <SubmitButton />
    </form>
  );
}
