"use client";

import { useState } from "react";
import PatientForm, { type PatientFormInitial } from "../PatientForm";
import type { SavedPhysician } from "@/app/dashboard/requests/new/NewRequestForm";
import { updatePatientAction, deletePatientAction } from "../new/actions";

export default function PatientDetailClient({
  patientId,
  initial,
  physicians,
  physicianName,
}: {
  patientId: string;
  initial: PatientFormInitial;
  physicians: SavedPhysician[];
  physicianName: string | null;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div>
        <button type="button" className="btn btn-outline btn-sm mb-4" onClick={() => setEditing(false)}>
          Cancel
        </button>
        <PatientForm
          formAction={updatePatientAction.bind(null, patientId)}
          physicians={physicians}
          initial={initial}
          submitLabel="Save changes"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>
          Edit
        </button>
        <form
          action={deletePatientAction.bind(null, patientId)}
          onSubmit={(e) => {
            if (!confirm("Delete this patient? This can't be undone. Any linked PA requests or claim denials will keep their own record, just unlinked from this patient.")) {
              e.preventDefault();
            }
          }}
        >
          <button type="submit" className="btn btn-outline btn-sm" style={{ color: "var(--danger-red)", borderColor: "var(--danger-red)" }}>
            Delete
          </button>
        </form>
      </div>

      <div className="card p-6">
        <h2 className="text-[15px] font-semibold mb-4">Patient Identity</h2>
        <dl className="grid grid-cols-2 gap-4 text-[13.5px]">
          <Field label="Full name" value={[initial.first_name, initial.middle_name, initial.last_name].filter(Boolean).join(" ")} />
          <Field label="Date of birth" value={initial.dob} />
          <Field label="Gender" value={initial.gender} />
          <Field label="Status" value={initial.status} className="capitalize" />
          <Field label="Preferred language" value={initial.preferred_language} />
        </dl>
      </div>

      <div className="card p-6">
        <h2 className="text-[15px] font-semibold mb-4">Contact</h2>
        <dl className="grid grid-cols-2 gap-4 text-[13.5px]">
          <Field label="Address" value={[initial.address, initial.city, initial.state, initial.zip].filter(Boolean).join(", ")} />
          <Field label="Phone" value={initial.phone} />
          <Field label="Email" value={initial.email} />
        </dl>
      </div>

      <div className="card p-6">
        <h2 className="text-[15px] font-semibold mb-4">Primary Insurance</h2>
        <dl className="grid grid-cols-2 gap-4 text-[13.5px]">
          <Field label="Insurance company" value={initial.insurance_company} />
          <Field label="Plan type" value={initial.plan_type} />
          <Field label="State of plan" value={initial.state_of_plan} />
          <Field label="Member ID" value={initial.member_id} />
          <Field label="Group number" value={initial.group_number} />
          <Field label="Plan name" value={initial.plan_name} />
        </dl>
      </div>

      {(initial.usual_physician_id || initial.primary_diagnosis_icd10) && (
        <div className="card p-6">
          <h2 className="text-[15px] font-semibold mb-4">Clinical &amp; Physician</h2>
          <dl className="grid grid-cols-2 gap-4 text-[13.5px]">
            <Field label="Usual ordering physician" value={physicianName} />
            <Field label="Primary diagnosis" value={[initial.primary_diagnosis_icd10, initial.primary_diagnosis_description].filter(Boolean).join(" — ")} />
          </dl>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, className }: { label: string; value?: string | null; className?: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-1">{label}</dt>
      <dd className={`text-gray-900 ${className || ""}`}>{value || "—"}</dd>
    </div>
  );
}
