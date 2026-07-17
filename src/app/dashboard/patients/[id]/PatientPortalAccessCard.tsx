import { requestPatientAccessAction } from "../access-actions";

interface SelfEnteredProfile {
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  insurance_company: string | null;
  member_id: string | null;
  known_drug_allergies: string | null;
  current_medications: string | null;
  medical_history: string | null;
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-1">{label}</div>
      <div className="text-[13.5px] text-gray-900">{value?.trim() ? value : <span className="text-gray-400">—</span>}</div>
    </div>
  );
}

// Only rendered when this practice's `patients` row has a matching
// patient_accounts email -- see [id]/page.tsx. Three states: no linked
// patient portal account at all (not rendered), linked but access not
// granted (locked card + Ask Access), or granted (the patient's own
// self-entered intake data).
export default function PatientPortalAccessCard({
  patientAccountId,
  accessGranted,
  alreadyRequested,
  profile,
}: {
  patientAccountId: string;
  accessGranted: boolean;
  alreadyRequested: boolean;
  profile: SelfEnteredProfile | null;
}) {
  if (accessGranted) {
    return (
      <div className="card p-6 mb-6">
        <h2 className="text-[15px] font-semibold mb-4">Patient Portal Information</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Field label="Address" value={[profile?.address, profile?.city, profile?.state, profile?.zip].filter(Boolean).join(", ")} />
          <Field label="Emergency contact" value={profile?.emergency_contact_name && profile?.emergency_contact_phone ? `${profile.emergency_contact_name} (${profile.emergency_contact_phone})` : profile?.emergency_contact_name} />
          <Field label="Insurance" value={profile?.insurance_company} />
          <Field label="Member ID" value={profile?.member_id} />
        </div>
        <div className="grid grid-cols-1 gap-4">
          <Field label="Medical history" value={profile?.medical_history} />
          <Field label="Known drug allergies" value={profile?.known_drug_allergies} />
          <Field label="Current medications" value={profile?.current_medications} />
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 mb-6 text-center">
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="var(--gray-600)" strokeWidth="1.3" />
          <path d="M5 7V5a3 3 0 016 0v2" stroke="var(--gray-600)" strokeWidth="1.3" />
        </svg>
      </div>
      <h2 className="text-[14.5px] font-semibold mb-1">Patient Portal information is locked</h2>
      <p className="text-[13px] text-gray-500 mb-4">
        This patient has a self-service portal account but hasn&apos;t granted you access to their self-entered intake data yet.
      </p>
      {alreadyRequested ? (
        <span className="status-pill" style={{ background: "var(--amber-bg)", color: "var(--amber)" }}>Access requested</span>
      ) : (
        <form action={requestPatientAccessAction}>
          <input type="hidden" name="patient_account_id" value={patientAccountId} />
          <button type="submit" className="btn btn-primary btn-sm">Ask Access</button>
        </form>
      )}
    </div>
  );
}
