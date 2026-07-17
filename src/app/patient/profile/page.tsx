import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PatientProfileCard from "./PatientProfileCard";

export default async function PatientProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const [{ data: account }, { data: profile }] = await Promise.all([
    supabase.from("patient_accounts").select("first_name, last_name, patient_ref_id, dob, mobile_phone, email").eq("id", user.id).single(),
    supabase.from("patient_profiles").select("*").eq("patient_account_id", user.id).maybeSingle(),
  ]);

  if (!account) redirect("/dashboard");

  return (
    <div className="max-w-2xl mx-auto px-5 sm:px-10 py-10">
      <h1 className="text-[20px] font-semibold mb-1">My Profile</h1>
      <p className="text-[14px] text-gray-600 mb-6">
        This is the same intake information your doctor&apos;s office would otherwise ask you for in person.
      </p>

      <PatientProfileCard identity={account} profile={profile} justSaved={saved === "1"} />
    </div>
  );
}
