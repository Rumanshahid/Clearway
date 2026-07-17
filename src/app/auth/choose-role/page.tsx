import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// Only reachable right after a brand-new Google/Microsoft sign-in with no
// prior practice or patient account -- see resolvePostLoginPath() in
// lib/auth-redirect.ts for why OAuth (unlike the two explicit signup forms)
// can't already know which one this person is.
export default async function ChooseRolePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  // Admin client for these identity checks -- see the comment in
  // lib/auth-redirect.ts for why the session-scoped client isn't used here.
  const admin = await createAdminClient();
  const { data: patientAccount } = await admin.from("patient_accounts").select("id").eq("id", user.id).maybeSingle();
  if (patientAccount) redirect("/patient");

  const { data: profile } = await admin.from("profiles").select("practice_id").eq("id", user.id).maybeSingle();
  if (profile?.practice_id) redirect("/dashboard");

  return (
    <>
      <h1 className="text-[22px] font-semibold mb-1">One more thing</h1>
      <p className="text-[14px] text-gray-600 mb-6">Are you signing in as a physician/staff member, or as a patient?</p>

      <div className="flex flex-col gap-3">
        <Link href="/onboarding" className="card p-5 flex items-center gap-4 hover:bg-gray-50 transition-colors">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--indigo-600)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c0-4 3.6-6 8-6s8 2 8 6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="text-[15px] font-semibold text-gray-900">Physician / Staff</div>
            <div className="text-[13px] text-gray-500">Set up your practice on asaanbil.com.</div>
          </div>
        </Link>

        <Link href="/auth/choose-role/patient" className="card p-5 flex items-center gap-4 hover:bg-gray-50 transition-colors">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--blue-500)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0112 6a5.5 5.5 0 019.5 6c-2.5 4.5-9.5 9-9.5 9z" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="text-[15px] font-semibold text-gray-900">Patient</div>
            <div className="text-[13px] text-gray-500">Get your Patient Reference ID and a portal for your info.</div>
          </div>
        </Link>
      </div>
    </>
  );
}
