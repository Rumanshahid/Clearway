import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminSidebar from "./AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "super_admin") redirect("/doctor/dashboard");

  return (
    <div className="min-h-screen flex">
      <AdminSidebar />
      <main className="flex-1 min-w-0 bg-gray-50">{children}</main>
    </div>
  );
}
