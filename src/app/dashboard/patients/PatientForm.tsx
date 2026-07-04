"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  PATIENT_SECTIONS,
  INSURANCE_COMPANIES,
  PLAN_TYPES,
  GENDERS,
  PATIENT_STATUSES,
  PREFERRED_CONTACT_METHODS,
  BEST_TIME_TO_CALL,
  RELATIONSHIPS,
  CONSENT_METHODS,
  COB_ORDERS,
  SPECIAL_HANDLING_FLAGS,
} from "@/lib/patients";
import type { SavedPhysician } from "@/app/dashboard/requests/new/NewRequestForm";

export interface PatientFormInitial {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  dob?: string;
  gender?: string;
  status?: string;
  ssn_last4?: string;
  preferred_language?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  mobile_phone?: string;
  email?: string;
  preferred_contact_method?: string;
  best_time_to_call?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  insurance_company?: string;
  plan_type?: string;
  state_of_plan?: string;
  member_id?: string;
  group_number?: string;
  plan_name?: string;
  effective_date?: string;
  coverage_end_date?: string;
  insurance_phone?: string;
  insurance_pa_fax?: string;
  has_secondary_insurance?: boolean;
  secondary_insurance_company?: string;
  secondary_plan_type?: string;
  secondary_member_id?: string;
  secondary_group_number?: string;
  cob_order?: string;
  usual_physician_id?: string;
  primary_diagnosis_icd10?: string;
  primary_diagnosis_description?: string;
  known_drug_allergies?: string;
  current_medications?: string;
  consent_obtained?: boolean;
  consent_date?: string;
  consent_method?: string;
  coordinator_notes?: string;
  preferred_letter_author_mode?: string;
  preferred_submission_method?: string;
  special_handling_flags?: string[];
  internal_tags?: string[];
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary" type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </button>
  );
}

function MoreOptionsToggle({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button type="button" className="text-btn text-[12.5px] text-indigo-600 font-medium mt-1" onClick={onClick}>
      {open ? "Fewer options" : "More options"}
    </button>
  );
}

export default function PatientForm({
  formAction,
  physicians,
  initial,
  submitLabel = "Save patient",
}: {
  formAction: (formData: FormData) => void | Promise<void>;
  physicians: SavedPhysician[];
  initial?: PatientFormInitial;
  submitLabel?: string;
}) {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(
    new Set(PATIENT_SECTIONS.filter((s) => s.defaultVisible).map((s) => s.key))
  );
  const [moreOpen, setMoreOpen] = useState<Record<string, boolean>>({});
  const [hasSecondary, setHasSecondary] = useState(initial?.has_secondary_insurance || false);
  const [consentChecked, setConsentChecked] = useState(initial?.consent_obtained || false);
  const [consentDate, setConsentDate] = useState(initial?.consent_date || "");

  function toggleSection(key: string) {
    setVisibleSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleMore(key: string) {
    setMoreOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const show = (key: string) => visibleSections.has(key);

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      <aside className="w-full lg:w-[230px] flex-shrink-0">
        <div className="card p-4">
          <div className="text-[13px] font-semibold text-gray-900 mb-3">Sections to show</div>
          <div className="flex flex-col gap-2">
            {PATIENT_SECTIONS.map((s) => (
              <label key={s.key} className="flex items-center gap-2 text-[13px] text-gray-600">
                <input
                  type="checkbox"
                  className="w-4 h-4"
                  checked={show(s.key)}
                  onChange={() => toggleSection(s.key)}
                />
                {s.label}
              </label>
            ))}
          </div>
          <p className="text-[11.5px] text-gray-400 mt-3">
            Identity, Contact, and Insurance are shown by default — everything an insurer needs to process a request.
          </p>
        </div>
      </aside>

      <form action={formAction} className="flex-1 min-w-0 w-full flex flex-col gap-6">
        {show("identity") && (
          <section className="card p-6">
            <h2 className="text-[15px] font-semibold mb-4">Patient Identity</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="first_name">First name <span style={{ color: "var(--danger-red)" }}>*</span></label>
                <input className="input" id="first_name" name="first_name" defaultValue={initial?.first_name} required />
              </div>
              <div>
                <label className="label" htmlFor="last_name">Last name <span style={{ color: "var(--danger-red)" }}>*</span></label>
                <input className="input" id="last_name" name="last_name" defaultValue={initial?.last_name} required />
              </div>
              <div>
                <label className="label" htmlFor="dob">Date of birth <span style={{ color: "var(--danger-red)" }}>*</span></label>
                <input className="input" id="dob" name="dob" type="date" defaultValue={initial?.dob} required />
              </div>
              <div>
                <label className="label" htmlFor="gender">Gender (as on insurance card) <span style={{ color: "var(--danger-red)" }}>*</span></label>
                <select className="input" id="gender" name="gender" defaultValue={initial?.gender || ""} required>
                  <option value="" disabled>Select…</option>
                  {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="status">Patient status</label>
                <select className="input" id="status" name="status" defaultValue={initial?.status || "active"}>
                  {PATIENT_STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                </select>
              </div>
            </div>

            <MoreOptionsToggle open={!!moreOpen.identity} onClick={() => toggleMore("identity")} />
            {moreOpen.identity && (
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="label" htmlFor="middle_name">Middle name</label>
                  <input className="input" id="middle_name" name="middle_name" defaultValue={initial?.middle_name} />
                </div>
                <div>
                  <label className="label" htmlFor="ssn_last4">SSN (last 4 digits)</label>
                  <input className="input" id="ssn_last4" name="ssn_last4" maxLength={4} defaultValue={initial?.ssn_last4} />
                  <p className="text-[12px] text-gray-400 mt-1">Never store the full SSN.</p>
                </div>
                <div>
                  <label className="label" htmlFor="preferred_language">Preferred language</label>
                  <input className="input" id="preferred_language" name="preferred_language" defaultValue={initial?.preferred_language} />
                </div>
              </div>
            )}
          </section>
        )}

        {show("contact") && (
          <section className="card p-6">
            <h2 className="text-[15px] font-semibold mb-4">Contact Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label" htmlFor="address">Street address</label>
                <input className="input" id="address" name="address" defaultValue={initial?.address} />
              </div>
              <div>
                <label className="label" htmlFor="city">City</label>
                <input className="input" id="city" name="city" defaultValue={initial?.city} />
              </div>
              <div>
                <label className="label" htmlFor="state">State</label>
                <input className="input" id="state" name="state" defaultValue={initial?.state} />
              </div>
              <div>
                <label className="label" htmlFor="zip">ZIP code</label>
                <input className="input" id="zip" name="zip" defaultValue={initial?.zip} />
              </div>
              <div>
                <label className="label" htmlFor="phone">Phone</label>
                <input className="input" id="phone" name="phone" type="tel" defaultValue={initial?.phone} />
              </div>
              <div className="col-span-2">
                <label className="label" htmlFor="email">Email</label>
                <input className="input" id="email" name="email" type="email" defaultValue={initial?.email} />
              </div>
            </div>

            <MoreOptionsToggle open={!!moreOpen.contact} onClick={() => toggleMore("contact")} />
            {moreOpen.contact && (
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="label" htmlFor="mobile_phone">Mobile phone</label>
                  <input className="input" id="mobile_phone" name="mobile_phone" type="tel" defaultValue={initial?.mobile_phone} />
                </div>
                <div>
                  <label className="label" htmlFor="preferred_contact_method">Preferred contact method</label>
                  <select className="input" id="preferred_contact_method" name="preferred_contact_method" defaultValue={initial?.preferred_contact_method || ""}>
                    <option value="">Not specified</option>
                    {PREFERRED_CONTACT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="best_time_to_call">Best time to call</label>
                  <select className="input" id="best_time_to_call" name="best_time_to_call" defaultValue={initial?.best_time_to_call || ""}>
                    <option value="">Not specified</option>
                    {BEST_TIME_TO_CALL.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="emergency_contact_name">Emergency contact name</label>
                  <input className="input" id="emergency_contact_name" name="emergency_contact_name" defaultValue={initial?.emergency_contact_name} />
                </div>
                <div>
                  <label className="label" htmlFor="emergency_contact_phone">Emergency contact phone</label>
                  <input className="input" id="emergency_contact_phone" name="emergency_contact_phone" type="tel" defaultValue={initial?.emergency_contact_phone} />
                </div>
                <div>
                  <label className="label" htmlFor="emergency_contact_relationship">Relationship</label>
                  <select className="input" id="emergency_contact_relationship" name="emergency_contact_relationship" defaultValue={initial?.emergency_contact_relationship || ""}>
                    <option value="">Not specified</option>
                    {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            )}
          </section>
        )}

        {show("insurance") && (
          <section className="card p-6">
            <h2 className="text-[15px] font-semibold mb-1">Primary Insurance</h2>
            <p className="text-[12.5px] text-gray-400 mb-4">Missing fields here are the most common reason a PA can&apos;t be filed at all.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="insurance_company">Insurance company</label>
                <select className="input" id="insurance_company" name="insurance_company" defaultValue={initial?.insurance_company || ""}>
                  <option value="">Select…</option>
                  {INSURANCE_COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="plan_type">Plan type</label>
                <select className="input" id="plan_type" name="plan_type" defaultValue={initial?.plan_type || ""}>
                  <option value="">Select…</option>
                  {PLAN_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="state_of_plan">State of plan</label>
                <input className="input" id="state_of_plan" name="state_of_plan" placeholder="e.g. TX" defaultValue={initial?.state_of_plan} />
              </div>
              <div>
                <label className="label" htmlFor="member_id">Member / Insurance ID</label>
                <input className="input" id="member_id" name="member_id" defaultValue={initial?.member_id} />
              </div>
              <div>
                <label className="label" htmlFor="group_number">Group number</label>
                <input className="input" id="group_number" name="group_number" defaultValue={initial?.group_number} />
              </div>
              <div>
                <label className="label" htmlFor="plan_name">Plan name</label>
                <input className="input" id="plan_name" name="plan_name" placeholder='e.g. "Aetna Select EPO Plan"' defaultValue={initial?.plan_name} />
              </div>
            </div>

            <MoreOptionsToggle open={!!moreOpen.insurance} onClick={() => toggleMore("insurance")} />
            {moreOpen.insurance && (
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="label" htmlFor="effective_date">Coverage effective date</label>
                  <input className="input" id="effective_date" name="effective_date" type="date" defaultValue={initial?.effective_date} />
                </div>
                <div>
                  <label className="label" htmlFor="coverage_end_date">Coverage end date</label>
                  <input className="input" id="coverage_end_date" name="coverage_end_date" type="date" defaultValue={initial?.coverage_end_date} />
                </div>
                <div>
                  <label className="label" htmlFor="insurance_phone">Insurance company phone</label>
                  <input className="input" id="insurance_phone" name="insurance_phone" type="tel" defaultValue={initial?.insurance_phone} />
                </div>
                <div>
                  <label className="label" htmlFor="insurance_pa_fax">Insurance PA fax number</label>
                  <input className="input" id="insurance_pa_fax" name="insurance_pa_fax" defaultValue={initial?.insurance_pa_fax} />
                </div>
              </div>
            )}
          </section>
        )}

        {show("secondary_insurance") && (
          <section className="card p-6">
            <h2 className="text-[15px] font-semibold mb-4">Secondary Insurance</h2>
            <label className="flex items-center gap-2 text-[13.5px] text-gray-900 mb-4">
              <input
                type="checkbox"
                name="has_secondary_insurance"
                className="w-4 h-4"
                checked={hasSecondary}
                onChange={(e) => setHasSecondary(e.target.checked)}
              />
              This patient has secondary insurance
            </label>
            {hasSecondary && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="secondary_insurance_company">Secondary insurance company</label>
                  <select className="input" id="secondary_insurance_company" name="secondary_insurance_company" defaultValue={initial?.secondary_insurance_company || ""}>
                    <option value="">Select…</option>
                    {INSURANCE_COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="secondary_plan_type">Secondary plan type</label>
                  <select className="input" id="secondary_plan_type" name="secondary_plan_type" defaultValue={initial?.secondary_plan_type || ""}>
                    <option value="">Select…</option>
                    {PLAN_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="secondary_member_id">Secondary member ID</label>
                  <input className="input" id="secondary_member_id" name="secondary_member_id" defaultValue={initial?.secondary_member_id} />
                </div>
                <div>
                  <label className="label" htmlFor="secondary_group_number">Secondary group number</label>
                  <input className="input" id="secondary_group_number" name="secondary_group_number" defaultValue={initial?.secondary_group_number} />
                </div>
                <div>
                  <label className="label" htmlFor="cob_order">Coordination of benefits order</label>
                  <select className="input" id="cob_order" name="cob_order" defaultValue={initial?.cob_order || ""}>
                    <option value="">Not specified</option>
                    {COB_ORDERS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            )}
          </section>
        )}

        {show("clinical") && (
          <section className="card p-6">
            <h2 className="text-[15px] font-semibold mb-4">Clinical &amp; Physician</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="usual_physician_id">Usual ordering physician</label>
                <select className="input" id="usual_physician_id" name="usual_physician_id" defaultValue={initial?.usual_physician_id || ""}>
                  <option value="">Not specified</option>
                  {physicians.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}{p.specialty ? ` — ${p.specialty}` : ""}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="primary_diagnosis_icd10">Primary diagnosis (ICD-10)</label>
                <input className="input" id="primary_diagnosis_icd10" name="primary_diagnosis_icd10" placeholder="e.g. M54.5" defaultValue={initial?.primary_diagnosis_icd10} />
              </div>
              <div className="col-span-2">
                <label className="label" htmlFor="primary_diagnosis_description">Diagnosis description</label>
                <input className="input" id="primary_diagnosis_description" name="primary_diagnosis_description" defaultValue={initial?.primary_diagnosis_description} />
              </div>
            </div>

            <MoreOptionsToggle open={!!moreOpen.clinical} onClick={() => toggleMore("clinical")} />
            {moreOpen.clinical && (
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="label" htmlFor="known_drug_allergies">Known drug allergies</label>
                  <input className="input" id="known_drug_allergies" name="known_drug_allergies" defaultValue={initial?.known_drug_allergies} />
                </div>
                <div>
                  <label className="label" htmlFor="current_medications">Current medications</label>
                  <input className="input" id="current_medications" name="current_medications" placeholder="name, dose, frequency" defaultValue={initial?.current_medications} />
                </div>
              </div>
            )}
          </section>
        )}

        {show("consent") && (
          <section className="card p-6">
            <h2 className="text-[15px] font-semibold mb-4">HIPAA Consent</h2>
            <label className="flex items-center gap-2 text-[13.5px] text-gray-900 mb-4">
              <input
                type="checkbox"
                name="consent_obtained"
                className="w-4 h-4"
                checked={consentChecked}
                onChange={(e) => {
                  setConsentChecked(e.target.checked);
                  if (e.target.checked && !consentDate) setConsentDate(new Date().toISOString().slice(0, 10));
                }}
              />
              Patient has consented to sharing PHI for prior-authorization purposes
            </label>
            {consentChecked && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="consent_date">Date consent obtained</label>
                  <input
                    className="input"
                    id="consent_date"
                    name="consent_date"
                    type="date"
                    value={consentDate}
                    onChange={(e) => setConsentDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="consent_method">Consent method</label>
                  <select className="input" id="consent_method" name="consent_method" defaultValue={initial?.consent_method || ""}>
                    <option value="">Select…</option>
                    {CONSENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            )}
          </section>
        )}

        {show("notes") && (
          <section className="card p-6">
            <h2 className="text-[15px] font-semibold mb-4">Practice-Internal Notes</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="label" htmlFor="coordinator_notes">PA coordinator notes</label>
                <textarea className="input" id="coordinator_notes" name="coordinator_notes" rows={3} defaultValue={initial?.coordinator_notes} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="preferred_letter_author_mode">Preferred letter author</label>
                  <select className="input" id="preferred_letter_author_mode" name="preferred_letter_author_mode" defaultValue={initial?.preferred_letter_author_mode || ""}>
                    <option value="">Use practice default</option>
                    <option value="doctor">Doctor-authored</option>
                    <option value="patient">Patient-authored</option>
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="preferred_submission_method">Preferred submission method</label>
                  <select className="input" id="preferred_submission_method" name="preferred_submission_method" defaultValue={initial?.preferred_submission_method || ""}>
                    <option value="">Not specified</option>
                    <option value="Payer portal">Payer portal</option>
                    <option value="Fax">Fax</option>
                    <option value="Phone">Phone</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label mb-2">Special handling flags</label>
                <div className="flex flex-col gap-2">
                  {SPECIAL_HANDLING_FLAGS.map((flag) => (
                    <label key={flag} className="flex items-center gap-2 text-[13.5px] text-gray-900">
                      <input
                        type="checkbox"
                        name="special_handling_flags"
                        value={flag}
                        defaultChecked={initial?.special_handling_flags?.includes(flag)}
                        className="w-4 h-4"
                      />
                      {flag}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="label" htmlFor="internal_tags">Internal tags (comma-separated)</label>
                <input
                  className="input"
                  id="internal_tags"
                  name="internal_tags"
                  placeholder="high-denier payer, complex case"
                  defaultValue={initial?.internal_tags?.join(", ")}
                />
              </div>
            </div>
          </section>
        )}

        <SubmitButton label={submitLabel} />
      </form>
    </div>
  );
}
