"use client";

import { useFormStatus } from "react-dom";
import { createAndDraftPatientPaRequestAction } from "./actions";

export interface DoctorOption {
  profileId: string;
  name: string;
  specialty: string | null;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary" type="submit" disabled={pending}>
      {pending ? "Drafting letter…" : "Draft letter"}
    </button>
  );
}

export default function PatientPaForm({ doctors }: { doctors: DoctorOption[] }) {
  return (
    <form action={createAndDraftPatientPaRequestAction} className="flex flex-col gap-4">
      <div>
        <label className="label" htmlFor="doctor_profile_id">Doctor</label>
        <select className="input" id="doctor_profile_id" name="doctor_profile_id" required defaultValue="">
          <option value="" disabled>Select a doctor…</option>
          {doctors.map((d) => (
            <option key={d.profileId} value={d.profileId}>{d.name}{d.specialty ? ` — ${d.specialty}` : ""}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="procedure_description">Procedure or purpose of visit</label>
        <textarea className="input" id="procedure_description" name="procedure_description" rows={3} required />
      </div>
      <div>
        <label className="label" htmlFor="notes">Additional notes (optional)</label>
        <textarea className="input" id="notes" name="notes" rows={2} />
      </div>
      <SubmitButton />
    </form>
  );
}
