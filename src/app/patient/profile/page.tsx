import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { calculateProfileCompletion } from "@/lib/patient-profile";
import ProfileProgressBar from "../ProfileProgressBar";
import PatientProfileForm from "./PatientProfileForm";

export default async function PatientProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
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

      <PatientProfileForm
        initial={{
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
