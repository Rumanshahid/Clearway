import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PatientSignupWizard from "./PatientSignupWizard";

export default async function PatientSignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="max-w-[520px] mx-auto py-12 px-5">
      <h1 className="text-[22px] font-semibold mb-1">Create your patient account</h1>
      <p className="text-[14px] text-gray-600 mb-6">
        Just enough to generate your Patient Reference ID — you can fill in the rest of your profile afterward.
      </p>
      <PatientSignupWizard error={error} />
    </div>
  );
}
