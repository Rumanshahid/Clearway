import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calculateProfileCompletion } from "@/lib/patient-profile";

export default async function PatientHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: account } = await supabase
    .from("patient_accounts")
    .select("first_name, patient_ref_id")
    .eq("id", user.id)
    .single();

  const { data: profile } = await supabase
    .from("patient_profiles")
    .select("*")
    .eq("patient_account_id", user.id)
    .maybeSingle();

  const completion = calculateProfileCompletion(profile);

  return (
    <div className="max-w-2xl mx-auto px-5 sm:px-10 py-10">
      <h1 className="text-[20px] font-semibold mb-6">Welcome back, {account?.first_name}</h1>

      <div className="rounded-2xl border border-gray-200 p-6 text-center mb-6">
        <p className="text-[12px] uppercase tracking-wide text-gray-500 mb-2">Your Patient Reference ID</p>
        <p className="text-[28px] font-bold text-indigo-600 mb-3">{account?.patient_ref_id}</p>
        <p className="text-[13px] text-gray-600 mb-4">
          Give this to your doctor&apos;s front desk before any appointment. Your information will auto-fill instantly.
        </p>
        <a href="/api/patient/card" className="btn w-full justify-center">Download your Patient Card (PDF)</a>
      </div>

      <div className="rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between text-[13px] text-gray-600 mb-1.5">
          <span>Profile completion</span>
          <span>{completion}%</span>
        </div>
        <div className="h-2 rounded-full bg-gray-200 mb-3">
          <div className="h-2 rounded-full bg-indigo-600" style={{ width: `${completion}%` }} />
        </div>
        {completion < 100 && (
          <p className="text-[12.5px] text-gray-500 mb-3">
            Complete your profile so your doctor&apos;s office never has to ask for your insurance card again.
          </p>
        )}
        <Link href="/patient/profile" className="btn btn-primary w-full justify-center">
          {completion < 100 ? "Complete your profile →" : "Edit your profile →"}
        </Link>
      </div>
    </div>
  );
}
