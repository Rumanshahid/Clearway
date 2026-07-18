"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import DateInput from "@/components/DateInput";
import { createPatientAccountAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary w-full justify-center" type="submit" disabled={pending}>
      {pending ? "Creating your account…" : "Create my account"}
    </button>
  );
}

export default function PatientSignupWizard({ error }: { error?: string }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [mobilePhone, setMobilePhone] = useState("");

  const identityComplete = firstName.trim() && lastName.trim() && dob && mobilePhone.trim();

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="text-[12px] font-semibold" style={{ color: step === 1 ? "var(--indigo-600)" : "var(--gray-400)" }}>
          Step 1 — Identity
        </div>
        <div className="flex-1 h-px" style={{ background: "var(--gray-200)" }} />
        <div className="text-[12px] font-semibold" style={{ color: step === 2 ? "var(--indigo-600)" : "var(--gray-400)" }}>
          Step 2 — Consent
        </div>
      </div>

      {error && (
        <div className="mb-4 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="first_name">First name</label>
              <input className="input" id="first_name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div>
              <label className="label" htmlFor="last_name">Last name</label>
              <input className="input" id="last_name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
            <div>
              <label className="label" htmlFor="dob">Date of birth</label>
              <DateInput id="dob" value={dob} onChange={setDob} required />
            </div>
            <div>
              <label className="label" htmlFor="mobile_phone">Mobile phone number</label>
              <input
                className="input"
                id="mobile_phone"
                type="tel"
                value={mobilePhone}
                onChange={(e) => setMobilePhone(e.target.value)}
                required
              />
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary w-full justify-center"
            disabled={!identityComplete}
            onClick={() => setStep(2)}
          >
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <form action={createPatientAccountAction} className="flex flex-col gap-4">
          <input type="hidden" name="first_name" value={firstName} />
          <input type="hidden" name="last_name" value={lastName} />
          <input type="hidden" name="dob" value={dob} />
          <input type="hidden" name="mobile_phone" value={mobilePhone} />

          <label className="flex items-start gap-2 text-[13.5px] text-gray-900">
            <input type="checkbox" name="consent_share_info" className="w-4 h-4 mt-0.5" required />
            I authorize Asaanbil to securely store my health and insurance information and share it with healthcare providers I authorize.
          </label>
          <label className="flex items-start gap-2 text-[13.5px] text-gray-900">
            <input type="checkbox" name="consent_terms_privacy" className="w-4 h-4 mt-0.5" required />
            I have read and agree to the Privacy Policy and Terms of Service.
          </label>
          <label className="flex items-start gap-2 text-[13.5px] text-gray-900">
            <input type="checkbox" name="consent_notifications" className="w-4 h-4 mt-0.5" required />
            I consent to receiving notifications about my healthcare-related requests.
          </label>

          <div className="flex gap-3">
            <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>
              Back
            </button>
            <div className="flex-1">
              <SubmitButton />
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
