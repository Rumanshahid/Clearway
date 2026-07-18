import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ChooseRolePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="max-w-[560px] mx-auto py-16 px-5">
      <h1 className="text-[22px] font-semibold mb-1 text-center">One quick thing</h1>
      <p className="text-[14px] text-gray-600 mb-8 text-center">Are you a physician / practice staff member, or a patient?</p>

      <div className="flex flex-col gap-4">
        <Link href="/onboarding" className="card p-6 hover:border-indigo-400 transition-colors" style={{ display: "block" }}>
          <div className="text-[15px] font-semibold mb-1">I&apos;m a physician / practice staff</div>
          <p className="text-[13.5px] text-gray-500">Set up your practice and manage prior-authorization requests.</p>
        </Link>

        <Link href="/auth/choose-role/patient" className="card p-6 hover:border-indigo-400 transition-colors" style={{ display: "block" }}>
          <div className="text-[15px] font-semibold mb-1">I&apos;m a patient</div>
          <p className="text-[13.5px] text-gray-500">Get a Patient Reference ID your doctor&apos;s office can use to pull up your info instantly.</p>
        </Link>
      </div>
    </div>
  );
}
