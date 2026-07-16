import Link from "next/link";
import { cookies } from "next/headers";

export default async function PatientWelcomePage() {
  const cookieStore = await cookies();
  const refId = cookieStore.get("patient_signup_ref")?.value;
  const firstName = cookieStore.get("patient_signup_name")?.value;

  return (
    <div className="max-w-lg mx-auto px-6 py-16">
      <h1 className="text-[22px] font-semibold mb-1">
        {firstName ? `Welcome, ${firstName}!` : "Welcome!"}
      </h1>
      <p className="text-[14px] text-gray-600 mb-8">Your account is ready. Here&apos;s your Patient Reference ID.</p>

      {refId ? (
        <div className="rounded-2xl border border-gray-200 p-8 text-center mb-6">
          <p className="text-[12px] uppercase tracking-wide text-gray-500 mb-2">Your Patient Reference ID</p>
          <p className="text-[32px] font-bold text-indigo-600 mb-3">{refId}</p>
          <p className="text-[13px] text-gray-600">
            Give this to your doctor&apos;s front desk before any appointment. Your information will auto-fill instantly.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 p-6 text-center mb-6 text-[13.5px] text-gray-600">
          Your reference ID is saved to your account — sign in and visit your profile to see it any time.
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center justify-between text-[13px] text-gray-600 mb-1.5">
          <span>Profile completion</span>
          <span>20%</span>
        </div>
        <div className="h-2 rounded-full bg-gray-200">
          <div className="h-2 rounded-full bg-indigo-600" style={{ width: "20%" }} />
        </div>
        <p className="text-[12.5px] text-gray-500 mt-2">
          Complete your profile so your doctor&apos;s office never has to ask for your insurance card again.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Link href="/patient/profile" className="btn btn-primary w-full justify-center">
          Complete your profile →
        </Link>
        {refId && (
          <a href="/api/patient/card" className="btn w-full justify-center">
            Download your Patient Card (PDF)
          </a>
        )}
      </div>
    </div>
  );
}
