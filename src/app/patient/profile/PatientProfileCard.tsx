"use client";

import { useState } from "react";
import { INSURANCE_COMPANIES, PLAN_TYPES, RELATIONSHIPS, PREFERRED_CONTACT_METHODS } from "@/lib/patients";
import { updatePatientProfileAction } from "./actions";

interface PatientIdentity {
  first_name: string;
  last_name: string;
  patient_ref_id: string;
  dob: string;
  mobile_phone: string;
  email: string;
}

interface PatientProfileData {
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  preferred_language: string | null;
  preferred_contact_method: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  insurance_company: string | null;
  plan_type: string | null;
  member_id: string | null;
  group_number: string | null;
  plan_name: string | null;
  has_secondary_insurance: boolean;
  secondary_insurance_company: string | null;
  secondary_member_id: string | null;
  secondary_group_number: string | null;
  known_drug_allergies: string | null;
  current_medications: string | null;
  medical_history: string | null;
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-[11.5px] uppercase tracking-wide text-gray-400 font-semibold mb-1">{label}</div>
      <div className="text-[14px] text-gray-900">{value?.trim() ? value : <span className="text-gray-400">Not provided</span>}</div>
    </div>
  );
}

// Mirrors dashboard/profiles/ProfileCard.tsx's view/edit toggle pattern:
// opens straight into editing the first time (nothing to show yet), and
// closes back to a read-only summary right after a save via the
// `justSaved` redirect trick -- a plain setEditing(false) on submit-click
// races the form's own pending navigation, so the server redirect back to
// this same page (with ?saved=1) is what actually flips the view.
export default function PatientProfileCard({
  identity,
  profile,
  justSaved,
}: {
  identity: PatientIdentity;
  profile: PatientProfileData | null;
  justSaved: boolean;
}) {
  const hasAnyData = !!profile && Object.values(profile).some((v) => v !== null && v !== "" && v !== false);
  const [editing, setEditing] = useState(!hasAnyData && !justSaved);

  if (!editing) {
    return (
      <div className="flex flex-col gap-6">
        <div className="card p-6 flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-[18px] font-semibold text-white flex-shrink-0"
            style={{ background: "var(--indigo-600)" }}
          >
            {identity.first_name.charAt(0).toUpperCase()}
            {identity.last_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[17px] font-semibold text-gray-900">{identity.first_name} {identity.last_name}</div>
            <div className="text-[13px] text-gray-500">{identity.email} · {identity.mobile_phone}</div>
            <div className="text-[12.5px] text-gray-400 mt-0.5">{identity.patient_ref_id} · DOB {identity.dob}</div>
          </div>
          <button type="button" className="btn btn-outline btn-sm flex-shrink-0" onClick={() => setEditing(true)}>
            Edit profile
          </button>
        </div>

        <div className="card p-6">
          <h2 className="text-[13.5px] font-semibold text-gray-700 mb-4">Contact Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Address" value={profile?.address} />
            <Field label="City" value={profile?.city} />
            <Field label="State" value={profile?.state} />
            <Field label="Zip" value={profile?.zip} />
            <Field label="Preferred language" value={profile?.preferred_language} />
            <Field label="Preferred contact method" value={profile?.preferred_contact_method} />
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-[13.5px] font-semibold text-gray-700 mb-4">Emergency Contact</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name" value={profile?.emergency_contact_name} />
            <Field label="Phone" value={profile?.emergency_contact_phone} />
            <Field label="Relationship" value={profile?.emergency_contact_relationship} />
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-[13.5px] font-semibold text-gray-700 mb-4">Insurance</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Primary insurance company" value={profile?.insurance_company} />
            <Field label="Plan type" value={profile?.plan_type} />
            <Field label="Member ID" value={profile?.member_id} />
            <Field label="Group number" value={profile?.group_number} />
            <Field label="Plan name" value={profile?.plan_name} />
            {profile?.has_secondary_insurance && (
              <>
                <Field label="Secondary insurance company" value={profile?.secondary_insurance_company} />
                <Field label="Secondary member ID" value={profile?.secondary_member_id} />
                <Field label="Secondary group number" value={profile?.secondary_group_number} />
              </>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-[13.5px] font-semibold text-gray-700 mb-4">Clinical</h2>
          <div className="grid grid-cols-1 gap-4">
            <Field label="Medical history" value={profile?.medical_history} />
            <Field label="Known drug allergies" value={profile?.known_drug_allergies} />
            <Field label="Current medications" value={profile?.current_medications} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <form action={updatePatientProfileAction} className="flex flex-col gap-6">
      <section>
        <h2 className="text-[13.5px] font-semibold text-gray-700 mb-3">Contact Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label" htmlFor="address">Address</label>
            <input className="input" id="address" name="address" defaultValue={profile?.address ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="city">City</label>
            <input className="input" id="city" name="city" defaultValue={profile?.city ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="state">State</label>
            <input className="input" id="state" name="state" defaultValue={profile?.state ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="zip">Zip</label>
            <input className="input" id="zip" name="zip" defaultValue={profile?.zip ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="preferred_language">Preferred language</label>
            <input className="input" id="preferred_language" name="preferred_language" defaultValue={profile?.preferred_language ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="preferred_contact_method">Preferred contact method</label>
            <select className="input" id="preferred_contact_method" name="preferred_contact_method" defaultValue={profile?.preferred_contact_method ?? ""}>
              <option value="">Select…</option>
              {PREFERRED_CONTACT_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-[13.5px] font-semibold text-gray-700 mb-3">Emergency Contact</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="emergency_contact_name">Name</label>
            <input className="input" id="emergency_contact_name" name="emergency_contact_name" defaultValue={profile?.emergency_contact_name ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="emergency_contact_phone">Phone</label>
            <input className="input" id="emergency_contact_phone" name="emergency_contact_phone" defaultValue={profile?.emergency_contact_phone ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="emergency_contact_relationship">Relationship</label>
            <select className="input" id="emergency_contact_relationship" name="emergency_contact_relationship" defaultValue={profile?.emergency_contact_relationship ?? ""}>
              <option value="">Select…</option>
              {RELATIONSHIPS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-[13.5px] font-semibold text-gray-700 mb-3">Primary Insurance</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="insurance_company">Insurance company</label>
            <select className="input" id="insurance_company" name="insurance_company" defaultValue={profile?.insurance_company ?? ""}>
              <option value="">Select…</option>
              {INSURANCE_COMPANIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="plan_type">Plan type</label>
            <select className="input" id="plan_type" name="plan_type" defaultValue={profile?.plan_type ?? ""}>
              <option value="">Select…</option>
              {PLAN_TYPES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="member_id">Member ID</label>
            <input className="input" id="member_id" name="member_id" defaultValue={profile?.member_id ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="group_number">Group number</label>
            <input className="input" id="group_number" name="group_number" defaultValue={profile?.group_number ?? ""} />
          </div>
          <div className="col-span-2">
            <label className="label" htmlFor="plan_name">Plan name</label>
            <input className="input" id="plan_name" name="plan_name" defaultValue={profile?.plan_name ?? ""} />
          </div>
        </div>
      </section>

      <section>
        <label className="flex items-center gap-2 text-[13.5px] font-semibold text-gray-700 mb-3">
          <input type="checkbox" name="has_secondary_insurance" defaultChecked={profile?.has_secondary_insurance ?? false} />
          I have secondary insurance
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="secondary_insurance_company">Secondary insurance company</label>
            <input className="input" id="secondary_insurance_company" name="secondary_insurance_company" defaultValue={profile?.secondary_insurance_company ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="secondary_member_id">Secondary member ID</label>
            <input className="input" id="secondary_member_id" name="secondary_member_id" defaultValue={profile?.secondary_member_id ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="secondary_group_number">Secondary group number</label>
            <input className="input" id="secondary_group_number" name="secondary_group_number" defaultValue={profile?.secondary_group_number ?? ""} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-[13.5px] font-semibold text-gray-700 mb-3">Clinical</h2>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="label" htmlFor="medical_history">Medical history</label>
            <textarea className="input" id="medical_history" name="medical_history" rows={3} defaultValue={profile?.medical_history ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="known_drug_allergies">Known drug allergies</label>
            <textarea className="input" id="known_drug_allergies" name="known_drug_allergies" rows={2} defaultValue={profile?.known_drug_allergies ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="current_medications">Current medications</label>
            <textarea className="input" id="current_medications" name="current_medications" rows={2} defaultValue={profile?.current_medications ?? ""} />
          </div>
        </div>
      </section>

      <div className="flex gap-3">
        {hasAnyData && (
          <button type="button" className="btn btn-outline w-full justify-center" onClick={() => setEditing(false)}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary w-full justify-center">Save profile</button>
      </div>
    </form>
  );
}
