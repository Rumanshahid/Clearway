"use client";

import { useState } from "react";
import { patientSignUpAction } from "../actions";

const STEPS = ["Account", "Identity", "Consent"] as const;

export default function PatientSignUpForm() {
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [mobilePhone, setMobilePhone] = useState("");
  const [consentShare, setConsentShare] = useState(false);
  const [consentTerms, setConsentTerms] = useState(false);
  const [consentNotifications, setConsentNotifications] = useState(false);

  function next() {
    setError("");
    if (step === 0) {
      if (!email || !password || password.length < 8) return setError("Enter a valid email and a password of at least 8 characters.");
      if (password !== confirmPassword) return setError("Passwords don't match.");
    }
    if (step === 1) {
      if (!firstName || !lastName || !dob || !mobilePhone) return setError("All fields are required.");
    }
    setStep((s) => s + 1);
  }

  function back() {
    setError("");
    setStep((s) => s - 1);
  }

  function handleSubmit(formData: FormData) {
    if (!consentShare || !consentTerms) {
      setError("Both consent checkboxes are required to create an account.");
      return;
    }
    setPending(true);
    return patientSignUpAction(formData);
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1 flex items-center gap-2">
            <div
              className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-indigo-600" : "bg-gray-200"}`}
            />
          </div>
        ))}
      </div>
      <p className="text-[12.5px] text-gray-500 mb-4">
        Step {step + 1} of {STEPS.length}: {STEPS[step]}
      </p>

      {error && (
        <div className="mb-4 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
          {error}
        </div>
      )}

      <form action={handleSubmit} className="flex flex-col gap-4">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="password" value={password} />
        <input type="hidden" name="confirm_password" value={confirmPassword} />
        <input type="hidden" name="first_name" value={firstName} />
        <input type="hidden" name="last_name" value={lastName} />
        <input type="hidden" name="dob" value={dob} />
        <input type="hidden" name="mobile_phone" value={mobilePhone} />
        {consentShare && <input type="hidden" name="consent_share" value="on" />}
        {consentTerms && <input type="hidden" name="consent_terms" value="on" />}
        {consentNotifications && <input type="hidden" name="consent_notifications" value="on" />}

        {step === 0 && (
          <>
            <div>
              <label className="label" htmlFor="p_email">Email address</label>
              <input className="input" id="p_email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label" htmlFor="p_password">Password</label>
              <input className="input" id="p_password" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div>
              <label className="label" htmlFor="p_confirm">Confirm password</label>
              <input className="input" id="p_confirm" type="password" minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            <button type="button" className="btn btn-primary w-full justify-center mt-2" onClick={next}>
              Continue →
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <label className="label" htmlFor="p_first">First name</label>
              <input className="input" id="p_first" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div>
              <label className="label" htmlFor="p_last">Last name</label>
              <input className="input" id="p_last" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
            <div>
              <label className="label" htmlFor="p_dob">Date of birth</label>
              <input className="input" id="p_dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
            </div>
            <div>
              <label className="label" htmlFor="p_phone">Mobile phone number</label>
              <input className="input" id="p_phone" type="tel" value={mobilePhone} onChange={(e) => setMobilePhone(e.target.value)} required />
            </div>
            <div className="flex gap-3 mt-2">
              <button type="button" className="btn w-full justify-center" onClick={back}>← Back</button>
              <button type="button" className="btn btn-primary w-full justify-center" onClick={next}>Continue →</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <label className="flex items-start gap-2 text-[13.5px] text-gray-700">
              <input type="checkbox" className="mt-1" checked={consentShare} onChange={(e) => setConsentShare(e.target.checked)} required />
              I authorize Asaanbil to securely store my health and insurance information and share it with healthcare providers I authorize.
            </label>
            <label className="flex items-start gap-2 text-[13.5px] text-gray-700">
              <input type="checkbox" className="mt-1" checked={consentTerms} onChange={(e) => setConsentTerms(e.target.checked)} required />
              I have read and agree to the Privacy Policy and Terms of Service.
            </label>
            <label className="flex items-start gap-2 text-[13.5px] text-gray-700">
              <input type="checkbox" className="mt-1" checked={consentNotifications} onChange={(e) => setConsentNotifications(e.target.checked)} />
              I consent to receiving notifications about my healthcare-related requests.
            </label>
            <div className="flex gap-3 mt-2">
              <button type="button" className="btn w-full justify-center" onClick={back} disabled={pending}>← Back</button>
              <button type="submit" className="btn btn-primary w-full justify-center" disabled={pending}>
                {pending ? "Creating account…" : "Create account →"}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
