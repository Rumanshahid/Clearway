import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDashboardNavData } from "@/lib/dashboardNav";
import DashboardNavBar from "./DashboardNavBar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const navData = await getDashboardNavData(user.id);
  if (!navData) redirect("/onboarding");

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardNavBar data={navData} />
      {navData.billingStatus === "suspended" && (
        <div className="text-[13px] px-6 py-2 text-center" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
          Your account is suspended for billing. <Link href="/dashboard/billing" className="underline">Update billing</Link> to resume drafting letters.
        </div>
      )}
      {navData.billingStatus === "grace_period" && (
        <div className="text-[13px] px-6 py-2 text-center" style={{ background: "var(--amber-bg)", color: "var(--amber)" }}>
          Your last payment failed. <Link href="/dashboard/billing" className="underline">Update billing</Link> before your account is suspended.
        </div>
      )}
      <main className="flex-1 bg-gray-50">{children}</main>
    </div>
  );
}
