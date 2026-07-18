"use client";

import { useFormStatus } from "react-dom";
import DateInput from "@/components/DateInput";
import { createPatientAppealRequestAction } from "./actions";
import type { DoctorOption } from "../pa/PatientPaForm";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary" type="submit" disabled={pending}>
      {pending ? "Submitting…" : "Submit appeal"}
    </button>
  );
}

export default function PatientAppealForm({ doctors }: { doctors: DoctorOption[] }) {
  return (
    <form action={createPatientAppealRequestAction} className="card p-6 flex flex-col gap-4">
      <h2 className="text-[15px] font-semibold">New appeal</h2>
      <div>
        <label className="label" htmlFor="doctor_profile_id">Doctor</label>
        <select className="input" id="doctor_profile_id" name="doctor_profile_id" required defaultValue="">
          <option value="" disabled>Select a doctor…</option>
          {doctors.map((d) => (
            <option key={d.profileId} value={d.profileId}>{d.name}{d.specialty ? ` — ${d.specialty}` : ""}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="claim_number">Claim number (optional)</label>
          <input className="input" id="claim_number" name="claim_number" />
        </div>
        <div>
          <label className="label" htmlFor="date_of_service">Date of service (optional)</label>
          <DateInput id="date_of_service" name="date_of_service" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="denial_reason">Why was the claim denied?</label>
        <textarea className="input" id="denial_reason" name="denial_reason" rows={3} required />
      </div>
      <div>
        <label className="label" htmlFor="notes">Additional notes (optional)</label>
        <textarea className="input" id="notes" name="notes" rows={2} />
      </div>
      <SubmitButton />
    </form>
  );
}
