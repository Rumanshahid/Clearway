"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  INSURANCE_COMPANIES,
  PLAN_TYPES,
  PREFERRED_CONTACT_METHODS,
  RELATIONSHIPS,
} from "@/lib/patients";
import { savePatientProfileAction } from "./actions";

export interface PatientProfileFormInitial {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  preferred_language?: string;
  preferred_contact_method?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  insurance_company?: string;
  plan_type?: string;
  member_id?: string;
  group_number?: string;
  plan_name?: string;
  has_secondary_insurance?: boolean;
  secondary_insurance_company?: string;
  secondary_member_id?: string;
  secondary_group_number?: string;
  known_drug_allergies?: string;
  current_medications?: string;
  medical_history?: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary" type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save profile"}
    </button>
  );
}

export default function PatientProfileForm({ initial }: { initial?: PatientProfileFormInitial }) {
  const [hasSecondary, setHasSecondary] = useState(initial?.has_secondary_insurance || false);

  return (
    <form action={savePatientProfileAction} className="flex flex-col gap-6">
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
            <label className="label" htmlFor="preferred_language">Preferred language</label>
            <input className="input" id="preferred_language" name="preferred_language" defaultValue={initial?.preferred_language} />
          </div>
          <div>
            <label className="label" htmlFor="preferred_contact_method">Preferred contact method</label>
            <select className="input" id="preferred_contact_method" name="preferred_contact_method" defaultValue={initial?.preferred_contact_method || ""}>
              <option value="">Not specified</option>
              {PREFERRED_CONTACT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-[15px] font-semibold mb-4">Emergency Contact</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="emergency_contact_name">Name</label>
            <input className="input" id="emergency_contact_name" name="emergency_contact_name" defaultValue={initial?.emergency_contact_name} />
          </div>
          <div>
            <label className="label" htmlFor="emergency_contact_phone">Phone</label>
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
      </section>

      <section className="card p-6">
        <h2 className="text-[15px] font-semibold mb-1">Primary Insurance</h2>
        <p className="text-[12.5px] text-gray-400 mb-4">This is what your doctor&apos;s office pulls up when they look up your Ref ID.</p>
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
            <label className="label" htmlFor="member_id">Member / Insurance ID</label>
            <input className="input" id="member_id" name="member_id" defaultValue={initial?.member_id} />
          </div>
          <div>
            <label className="label" htmlFor="group_number">Group number</label>
            <input className="input" id="group_number" name="group_number" defaultValue={initial?.group_number} />
          </div>
          <div className="col-span-2">
            <label className="label" htmlFor="plan_name">Plan name</label>
            <input className="input" id="plan_name" name="plan_name" placeholder='e.g. "Aetna Select EPO Plan"' defaultValue={initial?.plan_name} />
          </div>
        </div>
      </section>

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
          I have secondary insurance
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
              <label className="label" htmlFor="secondary_member_id">Secondary member ID</label>
              <input className="input" id="secondary_member_id" name="secondary_member_id" defaultValue={initial?.secondary_member_id} />
            </div>
            <div>
              <label className="label" htmlFor="secondary_group_number">Secondary group number</label>
              <input className="input" id="secondary_group_number" name="secondary_group_number" defaultValue={initial?.secondary_group_number} />
            </div>
          </div>
        )}
      </section>

      <section className="card p-6">
        <h2 className="text-[15px] font-semibold mb-4">Medical History</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="label" htmlFor="known_drug_allergies">Known drug allergies</label>
            <input className="input" id="known_drug_allergies" name="known_drug_allergies" defaultValue={initial?.known_drug_allergies} />
          </div>
          <div>
            <label className="label" htmlFor="current_medications">Current medications</label>
            <input className="input" id="current_medications" name="current_medications" placeholder="name, dose, frequency" defaultValue={initial?.current_medications} />
          </div>
          <div>
            <label className="label" htmlFor="medical_history">Relevant medical history</label>
            <textarea className="input" id="medical_history" name="medical_history" rows={3} defaultValue={initial?.medical_history} />
          </div>
        </div>
      </section>

      <SubmitButton />
    </form>
  );
}
