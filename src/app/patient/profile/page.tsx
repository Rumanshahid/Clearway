import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { calculateProfileCompletion } from "@/lib/patient-profile";
import ProfileProgressBar from "../ProfileProgressBar";
import PatientProfileForm from "./PatientProfileForm";

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-[11.5px] uppercase tracking-wide text-gray-400 font-semibold mb-0.5">{label}</div>
      <div className="text-[13.5px] text-gray-900">{value}</div>
    </div>
  );
}

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

  return (
    <div className="max-w-[760px] mx-auto py-8 px-5">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-[24px] font-semibold">{account.first_name} {account.last_name}</h1>
        <span className="text-[13px] text-gray-400">{account.patient_ref_id}</span>
      </div>
      <p className="text-[13.5px] text-gray-600 mb-6">Your Profile</p>

      {saved && (
        <div className="mb-4 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--success-bg)", color: "var(--success-green)" }}>
          Profile saved.
        </div>
      )}
      {error && (
        <div className="mb-4 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
          {error}
        </div>
      )}

      <div className="card p-6 mb-6">
        <ProfileProgressBar percent={percent} />
      </div>

      {editing ? (
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
      ) : (
        <div className="flex flex-col gap-6">
          <section className="card p-6">
            <div className="flex items-center gap-4 mb-4">
              <div
                className="rounded-full flex-shrink-0"
                style={{
                  width: 72,
                  height: 72,
                  background: "var(--gray-100)",
                  backgroundImage: account.avatar_url ? `url(${account.avatar_url})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div>
                <div className="text-[16px] font-semibold">{account.first_name} {account.last_name}</div>
                <div className="text-[12.5px] text-gray-400">{account.patient_ref_id}</div>
              </div>
              <Link href="/patient/profile?edit=1" className="btn btn-primary ml-auto">Edit profile</Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date of birth" value={account.dob} />
              <Field label="Mobile phone" value={account.mobile_phone} />
              <Field label="Email" value={account.email} />
            </div>
          </section>

          <section className="card p-6">
            <h2 className="text-[15px] font-semibold mb-4">Contact Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Street address" value={profile?.address} />
              <Field label="City" value={profile?.city} />
              <Field label="State" value={profile?.state} />
              <Field label="ZIP code" value={profile?.zip} />
              <Field label="Preferred language" value={profile?.preferred_language} />
              <Field label="Preferred contact method" value={profile?.preferred_contact_method} />
            </div>
          </section>

          <section className="card p-6">
            <h2 className="text-[15px] font-semibold mb-4">Emergency Contact</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Name" value={profile?.emergency_contact_name} />
              <Field label="Phone" value={profile?.emergency_contact_phone} />
              <Field label="Relationship" value={profile?.emergency_contact_relationship} />
            </div>
          </section>

          <section className="card p-6">
            <h2 className="text-[15px] font-semibold mb-4">Primary Insurance</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Insurance company" value={profile?.insurance_company} />
              <Field label="Plan type" value={profile?.plan_type} />
              <Field label="Member / Insurance ID" value={profile?.member_id} />
              <Field label="Group number" value={profile?.group_number} />
              <Field label="Plan name" value={profile?.plan_name} />
            </div>
          </section>

          {profile?.has_secondary_insurance && (
            <section className="card p-6">
              <h2 className="text-[15px] font-semibold mb-4">Secondary Insurance</h2>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Insurance company" value={profile?.secondary_insurance_company} />
                <Field label="Member ID" value={profile?.secondary_member_id} />
                <Field label="Group number" value={profile?.secondary_group_number} />
              </div>
            </section>
          )}

          <section className="card p-6">
            <h2 className="text-[15px] font-semibold mb-4">Medical History</h2>
            <div className="flex flex-col gap-4">
              <Field label="Known drug allergies" value={profile?.known_drug_allergies} />
              <Field label="Current medications" value={profile?.current_medications} />
              <Field label="Relevant medical history" value={profile?.medical_history} />
              {!profile?.known_drug_allergies && !profile?.current_medications && !profile?.medical_history && (
                <p className="text-gray-400 text-[13.5px]">Nothing on file yet.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
