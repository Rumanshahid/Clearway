import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { calculateProfileCompletion } from "@/lib/patient-profile";
import ProfileProgressBar from "./ProfileProgressBar";
import EmailCardButton from "./EmailCardButton";

const QUICK_LINKS = [
  { href: "/patient/profile", label: "Profile", description: "Your details, insurance, and contact info." },
  { href: "/patient/pa", label: "Prior Authorization", description: "Submit a request directly to your doctor." },
  { href: "/patient/appeals", label: "Appeals", description: "Appeal a denied claim." },
  { href: "/doctors", label: "Find a Doctor", description: "Search doctors and book an appointment." },
  { href: "/blog", label: "Blog", description: "Read, like, and comment on posts." },
  { href: "/questions", label: "Q&A", description: "Ask a question or help other patients." },
];

export default async function PatientHomePage() {
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
      <h1 className="text-[24px] font-semibold mb-1">Welcome, {account.first_name}</h1>
      <p className="text-[13.5px] text-gray-600 mb-6">{account.patient_ref_id}</p>

      <div className="card p-6 mb-6">
        <ProfileProgressBar percent={percent} />
        {percent < 100 && (
          <Link href="/patient/profile" className="btn btn-primary w-full justify-center mt-4">
            Complete your profile
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {QUICK_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="card p-5 hover:border-indigo-400 transition-colors" style={{ display: "block" }}>
            <div className="text-[14.5px] font-semibold mb-1">{link.label}</div>
            <p className="text-[12.5px] text-gray-500">{link.description}</p>
          </Link>
        ))}
      </div>

      <div className="card p-6 text-left">
        <div className="text-[14px] font-semibold mb-1">Your patient card</div>
        <p className="text-[13px] text-gray-500 mb-4">
          Give this to your doctor&apos;s front desk before any appointment — your information will auto-fill instantly.
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
