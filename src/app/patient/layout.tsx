import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import PatientSidebar from "./PatientSidebar";

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const admin = await createAdminClient();
  const { data: account } = await admin.from("patient_accounts").select("first_name, avatar_url").eq("id", user.id).maybeSingle();
  if (!account) redirect("/auth/choose-role");

  const { data: notifications } = await admin
    .from("notifications")
    .select("id, type, message, link, read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div className="min-h-screen flex">
      <PatientSidebar userId={user.id} name={account.first_name} avatarUrl={account.avatar_url} notifications={notifications || []} />
      <main className="flex-1 min-w-0 bg-gray-50">{children}</main>
    </div>
  );
}
