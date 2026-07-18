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

  const sectionLabel: React.CSSProperties = { fontSize: 10.5, fontWeight: 700, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 4 };
  const rowText: React.CSSProperties = { fontSize: 12.5, color: "var(--gray-600)", lineHeight: 1.6 };
  const section: React.CSSProperties = { marginBottom: 14 };

  return (
    <div className="wrap" style={{ padding: "24px 32px", maxWidth: 1200, margin: "0 auto" }}>
      {saved && (
        <div className="mb-3 text-[12.5px] rounded-lg px-3 py-1.5" style={{ background: "var(--success-bg)", color: "var(--success-green)" }}>
          Profile saved.
        </div>
      )}

      <div style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>
        {/* Compact profile summary -- everything fits without scrolling, so
            the rest of the page stays free for future widgets. */}
        <div style={{ width: 280, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <div
              className="rounded-full flex-shrink-0"
              style={{ width: 52, height: 52, background: "var(--gray-100)", backgroundImage: account.avatar_url ? `url(${account.avatar_url})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}
            />
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>{fullName}</h1>
              <p style={{ fontSize: 12, color: "var(--gray-400)" }}>{account.patient_ref_id}</p>
            </div>
          </div>
          <Link href="/patient/profile?edit=1" className="btn btn-primary btn-sm w-full justify-center" style={{ marginBottom: 12 }}>
            Edit Profile
          </Link>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            <span
              className="status-pill"
              style={{ fontSize: 11, ...(percent >= 100 ? { background: "var(--success-bg)", color: "var(--success-green)" } : { background: "#EEF0FF", color: "var(--indigo-600)" }) }}
            >
              {percent}% complete
            </span>
            {profile?.has_secondary_insurance && (
              <span className="status-pill" style={{ fontSize: 11, background: "var(--gray-100)", color: "var(--gray-600)" }}>2nd insurance</span>
            )}
          </div>

          <div style={section}>
            <div style={sectionLabel}>Contact</div>
            <p style={rowText}>{account.dob} · {account.mobile_phone}</p>
            <p style={rowText}>
              {account.email}
              {profile?.preferred_contact_method && ` · ${profile.preferred_contact_method}`}
            </p>
          </div>

          {insurancePills.length > 0 && (
            <div style={section}>
              <div style={sectionLabel}>Insurance</div>
              <p style={rowText}>{insurancePills.join(" · ")}</p>
              {(profile?.member_id || profile?.group_number) && (
                <p style={rowText}>
                  {profile?.member_id && `ID ${profile.member_id}`}
                  {profile?.member_id && profile?.group_number && " · "}
                  {profile?.group_number && `Grp ${profile.group_number}`}
                </p>
              )}
            </div>
          )}

          {(profile?.emergency_contact_name || profile?.emergency_contact_phone) && (
            <div style={section}>
              <div style={sectionLabel}>Emergency contact</div>
              <p style={rowText}>
                {profile?.emergency_contact_name}
                {profile?.emergency_contact_relationship && ` (${profile.emergency_contact_relationship})`}
              </p>
              {profile?.emergency_contact_phone && <p style={rowText}>{profile.emergency_contact_phone}</p>}
            </div>
          )}

          {(profile?.address || profile?.city) && (
            <div style={section}>
              <div style={sectionLabel}>Address</div>
              <p style={rowText}>
                {profile?.address}
                {profile?.address && ", "}
                {[profile?.city, profile?.state, profile?.zip].filter(Boolean).join(", ")}
              </p>
            </div>
          )}

          {(profile?.known_drug_allergies || profile?.current_medications || profile?.medical_history) && (
            <div style={section}>
              <div style={sectionLabel}>Medical history</div>
              {profile?.known_drug_allergies && <p style={rowText}>Allergies: {profile.known_drug_allergies}</p>}
              {profile?.current_medications && <p style={rowText}>Meds: {profile.current_medications}</p>}
              {profile?.medical_history && <p style={rowText}>{profile.medical_history}</p>}
            </div>
          )}
        </div>

        {/* Reserved for future widgets (upcoming appointments, recent PA/appeal
            status, etc.) -- intentionally left empty for now. */}
        <div style={{ flex: 1, minWidth: 0, minHeight: 400, borderRadius: 12, border: "1px dashed var(--gray-200)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontSize: 13, color: "var(--gray-300)" }}>More widgets coming soon</p>
        </div>
      </div>
    </div>
  );
}
