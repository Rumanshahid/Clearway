import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { calculateProfileCompletion } from "@/lib/patient-profile";
import PatientProfileForm from "./PatientProfileForm";

export default async function PatientProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string; edit?: string }>;
}) {
  const { error, saved, edit } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const admin = await createAdminClient();
  const { data: account } = await admin.from("patient_accounts").select("*").eq("id", user.id).maybeSingle();
  if (!account) redirect("/auth/choose-role");

  const { data: profile } = await admin.from("patient_profiles").select("*").eq("patient_account_id", user.id).maybeSingle();
  const percent = calculateProfileCompletion(account, profile);
  const editing = edit === "1";

  if (editing) {
    return (
      <div className="max-w-[760px] mx-auto py-8 px-5">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-[24px] font-semibold">{account.first_name} {account.last_name}</h1>
          <span className="text-[13px] text-gray-400">{account.patient_ref_id}</span>
        </div>
        <p className="text-[13.5px] text-gray-600 mb-6">Editing your profile</p>

        {error && (
          <div className="mb-4 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
            {error}
          </div>
        )}

        <PatientProfileForm
          initial={{
            avatar_url: account.avatar_url || undefined,
            first_name: account.first_name,
            last_name: account.last_name,
            dob: account.dob,
            mobile_phone: account.mobile_phone,
            address: profile?.address || undefined,
            city: profile?.city || undefined,
            state: profile?.state || undefined,
            zip: profile?.zip || undefined,
            preferred_language: profile?.preferred_language || undefined,
            preferred_contact_method: profile?.preferred_contact_method || undefined,
            emergency_contact_name: profile?.emergency_contact_name || undefined,
            emergency_contact_phone: profile?.emergency_contact_phone || undefined,
            emergency_contact_relationship: profile?.emergency_contact_relationship || undefined,
            insurance_company: profile?.insurance_company || undefined,
            plan_type: profile?.plan_type || undefined,
            member_id: profile?.member_id || undefined,
            group_number: profile?.group_number || undefined,
            plan_name: profile?.plan_name || undefined,
            has_secondary_insurance: profile?.has_secondary_insurance,
            secondary_insurance_company: profile?.secondary_insurance_company || undefined,
            secondary_member_id: profile?.secondary_member_id || undefined,
            secondary_group_number: profile?.secondary_group_number || undefined,
            known_drug_allergies: profile?.known_drug_allergies || undefined,
            current_medications: profile?.current_medications || undefined,
            medical_history: profile?.medical_history || undefined,
          }}
        />
      </div>
    );
  }

  const fullName = `${account.first_name} ${account.last_name}`;
  const insurancePills = [profile?.insurance_company, profile?.plan_type].filter(Boolean) as string[];

  return (
    <div className="wrap" style={{ padding: "48px 40px 80px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
        <Link href="/patient/profile?edit=1" className="btn btn-primary btn-sm">Edit Profile</Link>
      </div>

      {saved && (
        <div className="mt-4 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--success-bg)", color: "var(--success-green)" }}>
          Profile saved.
        </div>
      )}

      <div style={{ display: "flex", gap: 24, marginTop: 20, marginBottom: 32, flexWrap: "wrap" }}>
        <div
          className="rounded-full flex-shrink-0"
          style={{ width: 96, height: 96, background: "var(--gray-100)", backgroundImage: account.avatar_url ? `url(${account.avatar_url})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div style={{ flex: 1, minWidth: 240 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700 }}>{fullName}</h1>
          <p style={{ fontSize: 15, color: "var(--gray-600)", marginTop: 4 }}>{account.patient_ref_id}</p>
          <p style={{ fontSize: 13, color: "var(--gray-400)", marginTop: 2 }}>
            {account.dob} · {account.mobile_phone}
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <span
              className="status-pill"
              style={percent >= 100 ? { background: "var(--success-bg)", color: "var(--success-green)" } : { background: "#EEF0FF", color: "var(--indigo-600)" }}
            >
              Profile {percent}% complete
            </span>
            {profile?.has_secondary_insurance && (
              <span className="status-pill" style={{ background: "var(--gray-100)", color: "var(--gray-600)" }}>Secondary insurance on file</span>
            )}
          </div>
        </div>
      </div>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10 }}>Contact</h2>
        <p style={{ fontSize: 14.5, color: "var(--gray-600)", lineHeight: 1.7 }}>
          {account.email}
          {profile?.preferred_contact_method && ` · Prefers ${profile.preferred_contact_method.toLowerCase()}`}
        </p>
      </section>

      {insurancePills.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10 }}>Insurance</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {insurancePills.map((p) => (
              <span key={p} className="status-pill" style={{ background: "var(--gray-100)", color: "var(--gray-600)" }}>{p}</span>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8" style={{ marginBottom: 32 }}>
        <section>
          <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10 }}>Insurance details</h2>
          <ul style={{ fontSize: 14, color: "var(--gray-600)", lineHeight: 1.9 }}>
            {profile?.member_id && <li>Member ID: {profile.member_id}</li>}
            {profile?.group_number && <li>Group #: {profile.group_number}</li>}
            {profile?.plan_name && <li>{profile.plan_name}</li>}
            {!profile?.member_id && !profile?.group_number && !profile?.plan_name && <li style={{ color: "var(--gray-400)" }}>Nothing on file yet.</li>}
          </ul>
        </section>
        <section>
          <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10 }}>Emergency contact</h2>
          <ul style={{ fontSize: 14, color: "var(--gray-600)", lineHeight: 1.9 }}>
            {profile?.emergency_contact_name && <li>{profile.emergency_contact_name}{profile.emergency_contact_relationship ? ` (${profile.emergency_contact_relationship})` : ""}</li>}
            {profile?.emergency_contact_phone && <li>{profile.emergency_contact_phone}</li>}
            {!profile?.emergency_contact_name && !profile?.emergency_contact_phone && <li style={{ color: "var(--gray-400)" }}>Nothing on file yet.</li>}
          </ul>
        </section>
      </div>

      {(profile?.address || profile?.city) && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10 }}>Address</h2>
          <p style={{ fontSize: 14.5, color: "var(--gray-600)" }}>
            {profile?.address}{profile?.address && <br />}
            {[profile?.city, profile?.state, profile?.zip].filter(Boolean).join(", ")}
          </p>
        </section>
      )}

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10 }}>Medical history</h2>
        {profile?.known_drug_allergies || profile?.current_medications || profile?.medical_history ? (
          <ul style={{ fontSize: 14, color: "var(--gray-600)", lineHeight: 1.9 }}>
            {profile?.known_drug_allergies && <li>Allergies: {profile.known_drug_allergies}</li>}
            {profile?.current_medications && <li>Medications: {profile.current_medications}</li>}
            {profile?.medical_history && <li>{profile.medical_history}</li>}
          </ul>
        ) : (
          <p style={{ fontSize: 14.5, color: "var(--gray-400)" }}>Nothing on file yet.</p>
        )}
      </section>
    </div>
  );
}
