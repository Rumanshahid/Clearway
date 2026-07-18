import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { calculateProfileCompletion } from "@/lib/patient-profile";
import ProfileProgressBar from "../ProfileProgressBar";
import EmailCardButton from "../EmailCardButton";

export default async function PatientWelcomePage() {
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
    <div className="max-w-[520px] mx-auto py-14 px-5 text-center">
      <p className="text-[13px] text-gray-500 uppercase tracking-wide mb-2">Your Patient Reference ID</p>
      <p className="text-[40px] font-bold mb-2" style={{ color: "var(--indigo-600)" }}>{account.patient_ref_id}</p>
      <p className="text-[13.5px] text-gray-600 mb-8">
        Give this to your doctor&apos;s front desk before any appointment. Your information will auto-fill instantly.
      </p>

      <div className="card p-6 text-left mb-6">
        <ProfileProgressBar percent={percent} />
        <Link href="/patient/profile" className="btn btn-primary w-full justify-center mt-4">
          Complete your profile
        </Link>
      </div>

      <div className="card p-6 text-left">
        <div className="text-[14px] font-semibold mb-1">Your patient card</div>
        <p className="text-[13px] text-gray-500 mb-4">
          A simple PDF with your name, Ref ID, and a QR code the front desk can scan.
        </p>
        <div className="flex gap-3">
          <a href="/api/patient/card" target="_blank" rel="noreferrer" className="btn btn-outline">
            Download card
          </a>
          <EmailCardButton />
        </div>
      </div>
    </div>
  );
}
