import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPracticesPage() {
  const supabase = await createClient();
  const { data: practices } = await supabase
    .from("practices")
    .select("id, name, plan, billing_status, letters_used_this_period, letters_included, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-[1000px] mx-auto py-8 px-5">
      <h1 className="text-[24px] font-semibold mb-6">Practices</h1>

      <div className="card overflow-hidden">
        <table className="w-full text-[13.5px]">
          <thead>
            <tr className="text-left text-gray-400 text-[11px] uppercase tracking-wide" style={{ borderBottom: "1px solid var(--gray-200)" }}>
              <th className="px-5 py-3 font-semibold">Practice</th>
              <th className="px-5 py-3 font-semibold">Plan</th>
              <th className="px-5 py-3 font-semibold">Billing status</th>
              <th className="px-5 py-3 font-semibold">Usage</th>
              <th className="px-5 py-3 font-semibold">Signed up</th>
              <th className="px-5 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {(practices || []).map((p) => (
              <tr key={p.id} style={{ borderBottom: "1px solid var(--gray-200)" }}>
                <td className="px-5 py-3 font-medium">{p.name}</td>
                <td className="px-5 py-3 capitalize">{p.plan.replace("_", " ")}</td>
                <td className="px-5 py-3">
                  <span
                    className="status-pill"
                    style={
                      p.billing_status === "active"
                        ? { background: "var(--success-bg)", color: "var(--success-green)" }
                        : p.billing_status === "grace_period"
                          ? { background: "var(--amber-bg)", color: "var(--amber)" }
                          : { background: "var(--danger-bg)", color: "var(--danger-red)" }
                    }
                  >
                    {p.billing_status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-400">{p.letters_used_this_period} / {p.letters_included}</td>
                <td className="px-5 py-3 text-gray-400">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="px-5 py-3">
                  <Link href={`/admin/practices/${p.id}`} className="text-indigo-600">Manage →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
