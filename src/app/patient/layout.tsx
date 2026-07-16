import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "../(auth)/actions";

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: account } = await supabase
    .from("patient_accounts")
    .select("first_name, patient_ref_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!account) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <Link href="/patient" className="font-semibold text-[15px]">Asaanbil</Link>
        <nav className="flex items-center gap-5 text-[13.5px] text-gray-600">
          <Link href="/patient">Home</Link>
          <Link href="/patient/profile">My Profile</Link>
          <Link href="/questions">Q&amp;A</Link>
          <Link href="/notifications/settings">Notifications</Link>
          <span className="text-gray-400">{account.patient_ref_id}</span>
          <form action={signOutAction}>
            <button type="submit" className="text-gray-600 hover:text-gray-900">Sign out</button>
          </form>
        </nav>
      </header>
      <main className="flex-1 bg-gray-50">{children}</main>
    </div>
  );
}
