import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { completeOAuthPatientAction } from "../actions";

export default async function ChooseRolePatientPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  // Admin client for this identity check -- see the comment in
  // lib/auth-redirect.ts for why the session-scoped client isn't used here.
  const admin = await createAdminClient();
  const { data: patientAccount } = await admin.from("patient_accounts").select("id").eq("id", user.id).maybeSingle();
  if (patientAccount) redirect("/patient/profile");

  // Google/Microsoft populate this from the provider profile -- best-effort
  // split into first/last so the fields aren't blank, but still editable
  // (a "Jane A. Doe"-style name won't split cleanly, so this is a
  // convenience default, not something to trust as-is).
  const fullName = String(user.user_metadata?.full_name || user.user_metadata?.name || "");
  const [defaultFirst, ...rest] = fullName.split(" ");
  const defaultLast = rest.join(" ");

  return (
    <>
      <h1 className="text-[22px] font-semibold mb-1">Complete your patient account</h1>
      <p className="text-[14px] text-gray-600 mb-6">Just a few details to generate your Patient Reference ID.</p>

      {error && (
        <div className="mb-4 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
          {error}
        </div>
      )}

      <form action={completeOAuthPatientAction} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="first_name">First name</label>
            <input className="input" id="first_name" name="first_name" defaultValue={defaultFirst || ""} required />
          </div>
          <div>
            <label className="label" htmlFor="last_name">Last name</label>
            <input className="input" id="last_name" name="last_name" defaultValue={defaultLast || ""} required />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="dob">Date of birth</label>
          <input className="input" id="dob" name="dob" type="date" required />
        </div>
        <div>
          <label className="label" htmlFor="mobile_phone">Mobile phone number</label>
          <input className="input" id="mobile_phone" name="mobile_phone" type="tel" required />
        </div>

        <label className="flex items-start gap-2 text-[13px] text-gray-700 mt-2">
          <input type="checkbox" className="mt-1" name="consent_share" required />
          I authorize Asaanbil to securely store my health and insurance information and share it with healthcare providers I authorize.
        </label>
        <label className="flex items-start gap-2 text-[13px] text-gray-700">
          <input type="checkbox" className="mt-1" name="consent_terms" required />
          I have read and agree to the Privacy Policy and Terms of Service.
        </label>
        <label className="flex items-start gap-2 text-[13px] text-gray-700">
          <input type="checkbox" className="mt-1" name="consent_notifications" />
          I consent to receiving notifications about my healthcare-related requests.
        </label>

        <button className="btn btn-primary w-full justify-center mt-2" type="submit">
          Create my patient account →
        </button>
      </form>

      <p className="text-[13px] text-gray-500 mt-4 text-center">
        <Link href="/auth/choose-role" className="text-indigo-600 font-medium">← Actually, I&apos;m a physician/staff member</Link>
      </p>
    </>
  );
}
