import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/(auth)/actions";

const NAV = [
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/practices", label: "Practices" },
  { href: "/admin/criteria", label: "Criteria" },
  { href: "/admin/prompt", label: "Prompt" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/revenue", label: "Revenue" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/access-log", label: "Access Log" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "super_admin") redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b" style={{ background: "var(--navy-900)", borderColor: "var(--gray-200)" }}>
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/admin/practices" className="flex items-center gap-2 text-[16px] font-semibold text-white">
              asaanbil.com <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,.14)" }}>Admin</span>
            </Link>
            <div className="flex items-center gap-5 text-[13.5px]" style={{ color: "#A0A8C0" }}>
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-white">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-[12.5px]" style={{ color: "#A0A8C0" }}>Back to app</Link>
            <form action={signOutAction}>
              <button className="btn btn-outline btn-sm" type="submit">Sign out</button>
            </form>
          </div>
        </div>
      </nav>
      <main className="flex-1 bg-gray-50">{children}</main>
    </div>
  );
}
