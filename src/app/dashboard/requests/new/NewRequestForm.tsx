"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import type { FieldDef, PayerKey, ProcedureCriteria } from "@/lib/criteria";
import { createRequestAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary w-full justify-center" type="submit" disabled={pending}>
      {pending ? "Drafting with Claude… (can take up to a minute)" : "Draft letter →"}
    </button>
  );
}

export default function NewRequestForm({
  procedures,
  payers,
  payerToggles,
  initialProcedure,
}: {
  procedures: ProcedureCriteria[];
  payers: { key: PayerKey; label: string; hasCriteria: boolean }[];
  payerToggles: Record<string, Record<string, boolean>>;
  initialProcedure?: string;
}) {
  const [procedureKey, setProcedureKey] = useState(initialProcedure || procedures[0].key);

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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="patient_reference">Patient reference (de-identified)</label>
            <input className="input" id="patient_reference" name="patient_reference" placeholder="e.g. PT-00417" required />
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
                No published criteria for this payer yet — Claude will draft against general clinical necessity
                and flag that explicitly.
              </p>
            )}
          </div>
          <div>
            <label className="label" htmlFor="icd10_codes">ICD-10 diagnosis code(s)</label>
            <input className="input" id="icd10_codes" name="icd10_codes" placeholder="M54.5, M51.16" required />
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-[15px] font-semibold mb-1">{procedure.label} — required details</h2>
        <p className="text-[12.5px] text-gray-400 mb-4">
          Fields marked * are required before this can be sent to Claude for drafting.
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
            Any of these bypass the standard conservative-care requirement — Claude will lead the letter with them.
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
          <div className="col-span-2">
            <label className="label" htmlFor="intended_use">Intended use of imaging result</label>
            <input className="input" id="intended_use" name="intended_use" placeholder="e.g. surgical planning" />
          </div>
          <div>
            <label className="label" htmlFor="ordering_physician_name">Ordering physician name</label>
            <input className="input" id="ordering_physician_name" name="ordering_physician_name" required />
          </div>
          <div>
            <label className="label" htmlFor="ordering_physician_credentials">Credentials</label>
            <input className="input" id="ordering_physician_credentials" name="ordering_physician_credentials" placeholder="MD, DO, ..." />
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
