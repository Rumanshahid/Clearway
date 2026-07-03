"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import type { FieldDef, PayerKey, ProcedureCriteria } from "@/lib/criteria";
import type { AuthoringMode } from "@/lib/database.types";
import { createRequestAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary w-full justify-center" type="submit" disabled={pending}>
      {pending ? "Drafting your letter… (can take up to a minute)" : "Draft letter →"}
    </button>
  );
}

export default function NewRequestForm({
  procedures,
  payers,
  payerToggles,
  initialProcedure,
  defaultAuthoringMode,
}: {
  procedures: ProcedureCriteria[];
  payers: { key: PayerKey; label: string; hasCriteria: boolean }[];
  payerToggles: Record<string, Record<string, boolean>>;
  initialProcedure?: string;
  defaultAuthoringMode: AuthoringMode;
}) {
  const [procedureKey, setProcedureKey] = useState(initialProcedure || procedures[0].key);
  const [authoringMode, setAuthoringMode] = useState<AuthoringMode>(defaultAuthoringMode);

  const procedure = useMemo(
    () => procedures.find((p) => p.key === procedureKey) || procedures[0],
    [procedureKey, procedures]
  );

  const availablePayers = useMemo(
    () => payers.filter((p) => payerToggles[procedureKey]?.[p.key] !== false),
    [payers, payerToggles, procedureKey]
  );

  // Tracks the user's explicit choice; falls back to the first available payer
  // whenever that choice isn't valid for the selected procedure (avoids a
  // setState-in-effect just to keep these two pieces of state in sync).
  const [payerKeyOverride, setPayerKeyOverride] = useState<PayerKey | null>(null);
  const payerKey =
    payerKeyOverride && availablePayers.find((p) => p.key === payerKeyOverride)
      ? payerKeyOverride
      : availablePayers[0]?.key || "aetna";

  return (
    <form action={createRequestAction} className="flex flex-col gap-6">
      <section className="card p-6">
        <h2 className="text-[15px] font-semibold mb-4">Case</h2>

        <div className="mb-5">
          <label className="label mb-2">Written for</label>
          <div className="inline-flex rounded-[10px] border overflow-hidden" style={{ borderColor: "var(--gray-200)" }}>
            <button
              type="button"
              className="px-4 py-2 text-[13px] font-medium transition-colors"
              style={
                authoringMode === "doctor"
                  ? { background: "var(--indigo-600)", color: "#fff" }
                  : { background: "#fff", color: "var(--gray-600)" }
              }
              onClick={() => setAuthoringMode("doctor")}
            >
              Doctor-authored
            </button>
            <button
              type="button"
              className="px-4 py-2 text-[13px] font-medium transition-colors"
              style={
                authoringMode === "patient"
                  ? { background: "var(--indigo-600)", color: "#fff" }
                  : { background: "#fff", color: "var(--gray-600)" }
              }
              onClick={() => setAuthoringMode("patient")}
            >
              Patient-authored
            </button>
          </div>
          <input type="hidden" name="authoring_mode" value={authoringMode} />
          <p className="text-[12px] text-gray-400 mt-1">
            {authoringMode === "doctor"
              ? "Written in first person by the ordering physician — the standard for a new request."
              : "Written in the patient's own voice, for a patient filing their own appeal — the ordering physician's statement is referenced as an enclosure."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="patient_reference">Patient reference (internal use only)</label>
            <input className="input" id="patient_reference" name="patient_reference" placeholder="e.g. PT-00417" required />
            <p className="text-[12px] text-gray-400 mt-1">Used in your dashboard and notifications — never sent to the payer.</p>
          </div>
          <div>
            <label className="label" htmlFor="plan_type">Plan type</label>
            <select className="input" id="plan_type" name="plan_type" defaultValue="">
              <option value="">Not specified</option>
              <option value="Commercial">Commercial</option>
              <option value="Medicare Advantage">Medicare Advantage</option>
              <option value="Medicaid">Medicaid</option>
              <option value="ACA Exchange">ACA Exchange</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="procedure_type">Procedure type</label>
            <select
              className="input"
              id="procedure_type"
              name="procedure_type"
              value={procedureKey}
              onChange={(e) => setProcedureKey(e.target.value)}
            >
              {procedures.map((p) => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="payer">Payer</label>
            <select
              className="input"
              id="payer"
              name="payer"
              value={payerKey}
              onChange={(e) => setPayerKeyOverride(e.target.value as PayerKey)}
            >
              {availablePayers.map((p) => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
            {!availablePayers.find((p) => p.key === payerKey)?.hasCriteria && (
              <p className="text-[12px] mt-1" style={{ color: "var(--amber)" }}>
                No published criteria for this payer yet — the letter will be drafted against general clinical
                necessity and flag that explicitly.
              </p>
            )}
          </div>
          <div>
            <label className="label" htmlFor="icd10_codes">ICD-10 diagnosis code(s)</label>
            <input className="input" id="icd10_codes" name="icd10_codes" placeholder="M54.5, M51.16" required />
          </div>
          <div>
            <label className="label" htmlFor="member_id">Member ID</label>
            <input className="input" id="member_id" name="member_id" placeholder="Payer member ID" />
          </div>
          <div>
            <label className="label" htmlFor="insurance_group_number">Insurance group number</label>
            <input className="input" id="insurance_group_number" name="insurance_group_number" placeholder="e.g. AET-77443" />
          </div>
          <div>
            <label className="label" htmlFor="cpt_code">CPT/HCPCS code</label>
            <input className="input" id="cpt_code" name="cpt_code" placeholder="e.g. 72148" />
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-[15px] font-semibold mb-1">Patient</h2>
        <p className="text-[12.5px] text-gray-400 mb-4">
          Full legal name and date of birth are required — a payer can&apos;t process a request without them. This
          information is only used inside the letter itself; the internal reference above stays de-identified everywhere else in the app.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="patient_full_name">Full legal name <span style={{ color: "var(--danger-red)" }}>*</span></label>
            <input className="input" id="patient_full_name" name="patient_full_name" required />
          </div>
          <div>
            <label className="label" htmlFor="patient_dob">Date of birth <span style={{ color: "var(--danger-red)" }}>*</span></label>
            <input className="input" id="patient_dob" name="patient_dob" type="date" required />
          </div>
          <div>
            <label className="label" htmlFor="patient_address">Street address</label>
            <input className="input" id="patient_address" name="patient_address" placeholder="123 Main St" />
          </div>
          <div>
            <label className="label" htmlFor="patient_city_state_zip">City, state, ZIP</label>
            <input className="input" id="patient_city_state_zip" name="patient_city_state_zip" placeholder="Austin, TX 78701" />
          </div>
          <div>
            <label className="label" htmlFor="patient_phone">Phone</label>
            <input className="input" id="patient_phone" name="patient_phone" type="tel" />
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-[15px] font-semibold mb-1">{procedure.label} — required details</h2>
        <p className="text-[12.5px] text-gray-400 mb-4">
          Fields marked * are required before drafting can start.
        </p>
        <div className="flex flex-col gap-4">
          {procedure.requiredFields.map((field) => (
            <DynamicField key={field.key} field={field} />
          ))}
        </div>
      </section>

      {procedure.redFlags.length > 0 && (
        <section className="card p-6">
          <h2 className="text-[15px] font-semibold mb-1">Red flags present?</h2>
          <p className="text-[12.5px] text-gray-400 mb-4">
            Any of these bypass the standard conservative-care requirement — the letter will lead with them.
          </p>
          <div className="flex flex-col gap-2">
            {procedure.redFlags.map((flag) => (
              <label key={flag} className="flex items-start gap-2 text-[13.5px] text-gray-900">
                <input type="checkbox" name="red_flags" value={flag} className="w-4 h-4 mt-0.5" />
                {flag}
              </label>
            ))}
          </div>
        </section>
      )}

      <section className="card p-6">
        <h2 className="text-[15px] font-semibold mb-4">Intent &amp; ordering physician</h2>
        <div className="grid grid-cols-2 gap-4">
          {/* Some procedures (e.g. Lumbar Spine MRI) already collect "intended
              use" as one of their own required fields above — skip the
              duplicate here, since a second field with the same name would
              silently overwrite the first in the submitted form data. */}
          {!procedure.requiredFields.some((f) => f.key === "intended_use") && (
            <div className="col-span-2">
              <label className="label" htmlFor="intended_use">Intended use of imaging result</label>
              <input className="input" id="intended_use" name="intended_use" placeholder="e.g. surgical planning" />
            </div>
          )}
          <div>
            <label className="label" htmlFor="ordering_physician_name">Ordering physician name</label>
            <input className="input" id="ordering_physician_name" name="ordering_physician_name" required />
          </div>
          <div>
            <label className="label" htmlFor="ordering_physician_credentials">Credentials</label>
            <input className="input" id="ordering_physician_credentials" name="ordering_physician_credentials" placeholder="MD, DO, ..." />
          </div>
          <div>
            <label className="label" htmlFor="ordering_physician_npi">NPI <span style={{ color: "var(--danger-red)" }}>*</span></label>
            <input className="input" id="ordering_physician_npi" name="ordering_physician_npi" placeholder="10-digit NPI" required />
          </div>
          <div>
            <label className="label" htmlFor="ordering_physician_direct_phone">Direct phone <span style={{ color: "var(--danger-red)" }}>*</span></label>
            <input className="input" id="ordering_physician_direct_phone" name="ordering_physician_direct_phone" type="tel" placeholder="For the peer-to-peer offer" required />
          </div>
          <div>
            <label className="label" htmlFor="ordering_physician_specialty">Specialty</label>
            <input className="input" id="ordering_physician_specialty" name="ordering_physician_specialty" placeholder="e.g. Orthopedic Surgery" />
          </div>
          <div>
            <label className="label" htmlFor="ordering_physician_fax">Fax</label>
            <input className="input" id="ordering_physician_fax" name="ordering_physician_fax" placeholder="Optional but strengthens the letter" />
          </div>
        </div>
      </section>

      <SubmitButton />
    </form>
  );
}

function DynamicField({ field }: { field: FieldDef }) {
  return (
    <div>
      <label className="label" htmlFor={field.key}>
        {field.label}
        {field.required && <span style={{ color: "var(--danger-red)" }}> *</span>}
      </label>
      {field.type === "textarea" ? (
        <textarea className="input" id={field.key} name={field.key} rows={3} required={field.required} />
      ) : field.type === "select" ? (
        <select className="input" id={field.key} name={field.key} required={field.required} defaultValue="">
          <option value="" disabled>Select…</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : field.type === "number" ? (
        <input className="input" id={field.key} name={field.key} type="number" required={field.required} />
      ) : (
        <input className="input" id={field.key} name={field.key} type="text" required={field.required} />
      )}
      {field.helpText && <p className="text-[12px] text-gray-400 mt-1">{field.helpText}</p>}
    </div>
  );
}
