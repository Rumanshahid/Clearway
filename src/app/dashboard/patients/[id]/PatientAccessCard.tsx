import { requestPatientAccessAction } from "./access-actions";

export interface PatientProfileAccess {
  patientAccountId: string;
  patientId: string;
  accessGranted: boolean;
  requested: boolean;
  profile?: {
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    emergency_contact_relationship: string | null;
    insurance_company: string | null;
    plan_type: string | null;
    member_id: string | null;
    group_number: string | null;
    known_drug_allergies: string | null;
    current_medications: string | null;
    medical_history: string | null;
  } | null;
}

export default function PatientAccessCard({ access }: { access: PatientProfileAccess }) {
  if (!access.accessGranted) {
    return (
      <div className="card p-6">
        <h2 className="text-[15px] font-semibold mb-1">Patient Portal</h2>
        <p className="text-[13px] text-gray-500 mb-4">
          This patient has their own self-entered profile, but it&apos;s locked until they grant you access.
        </p>
        <form action={requestPatientAccessAction}>
          <input type="hidden" name="patient_account_id" value={access.patientAccountId} />
          <input type="hidden" name="patient_id" value={access.patientId} />
          <button type="submit" className="btn btn-outline" disabled={access.requested}>
            {access.requested ? "Access requested" : "Ask Access"}
          </button>
        </form>
      </div>
    );
  }

  const p = access.profile;
  return (
    <div className="card p-6">
      <h2 className="text-[15px] font-semibold mb-4">Patient Portal — self-entered profile</h2>
      <div className="grid grid-cols-2 gap-4 text-[13.5px]">
        <div>
          <div className="text-[11.5px] uppercase tracking-wide text-gray-400 font-semibold mb-0.5">Address</div>
          <div className="text-gray-900">{[p?.address, p?.city, p?.state, p?.zip].filter(Boolean).join(", ") || "—"}</div>
        </div>
        <div>
          <div className="text-[11.5px] uppercase tracking-wide text-gray-400 font-semibold mb-0.5">Emergency contact</div>
          <div className="text-gray-900">
            {p?.emergency_contact_name || "—"}
            {p?.emergency_contact_relationship ? ` (${p.emergency_contact_relationship})` : ""}
            {p?.emergency_contact_phone ? ` · ${p.emergency_contact_phone}` : ""}
          </div>
        </div>
        <div>
          <div className="text-[11.5px] uppercase tracking-wide text-gray-400 font-semibold mb-0.5">Insurance</div>
          <div className="text-gray-900">
            {[p?.insurance_company, p?.plan_type].filter(Boolean).join(" · ") || "—"}
            {p?.member_id ? ` · ID ${p.member_id}` : ""}
            {p?.group_number ? ` · Grp ${p.group_number}` : ""}
          </div>
        </div>
        <div>
          <div className="text-[11.5px] uppercase tracking-wide text-gray-400 font-semibold mb-0.5">Medical history</div>
          <div className="text-gray-900">
            {[p?.known_drug_allergies, p?.current_medications, p?.medical_history].filter(Boolean).join(" · ") || "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
