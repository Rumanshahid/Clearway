import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PatientUserMenu from "./PatientUserMenu";
import PatientNotificationBell from "./PatientNotificationBell";

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: account, error: accountError } = await supabase
    .from("patient_accounts")
    .select("first_name, patient_ref_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!account) {
    console.error("patient/layout: no patient_accounts row for user", user.id, "error:", accountError?.message, accountError?.code);
    redirect("/dashboard");
  }

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, type, message, link, read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 px-5 sm:px-10 py-3 flex items-center justify-between">
        <Link href="/patient" className="font-semibold text-[15px]">Asaanbil</Link>
        <nav className="hidden lg:flex items-center gap-5 text-[13.5px] text-gray-600">
          <Link href="/patient" className="hover:text-gray-900">Dashboard</Link>
          <Link href="/patient/pa" className="hover:text-gray-900">PA</Link>
          <Link href="/patient/appeals" className="hover:text-gray-900">Appeals</Link>
          <Link href="/blog" className="hover:text-gray-900">Blog</Link>
          <Link href="/questions" className="hover:text-gray-900">Q&amp;A</Link>
        </nav>
        <div className="flex items-center gap-1">
          <PatientNotificationBell notifications={notifications || []} />
          <PatientUserMenu name={account.first_name} />
        </div>
      </header>
      <nav className="lg:hidden border-b border-gray-200 px-5 py-2 flex items-center gap-4 text-[13px] text-gray-600 overflow-x-auto">
        <Link href="/patient" className="flex-shrink-0">Dashboard</Link>
        <Link href="/patient/pa" className="flex-shrink-0">PA</Link>
        <Link href="/patient/appeals" className="flex-shrink-0">Appeals</Link>
        <Link href="/blog" className="flex-shrink-0">Blog</Link>
        <Link href="/questions" className="flex-shrink-0">Q&amp;A</Link>
      </nav>
      <main className="flex-1 bg-gray-50">{children}</main>
    </div>
  );
}
