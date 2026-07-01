import { createClient } from "@/lib/supabase/server";
import { PRACTICE_MONTHLY_PRICE_USD } from "@/lib/billing";

export default async function AdminRevenuePage() {
  const supabase = await createClient();

  const { data: practices } = await supabase.from("practices").select("id, name, plan, billing_status, created_at");
  const { data: rawEvents } = await supabase
    .from("billing_events")
    .select("id, practice_id, event_type, occurred_at")
    .order("occurred_at", { ascending: false })
    .limit(50);

  const practiceNameById = new Map((practices || []).map((p) => [p.id, p.name]));
  const events = (rawEvents || []).map((e) => ({ ...e, practiceName: practiceNameById.get(e.practice_id || "") || "—" }));

  const activePractice = (practices || []).filter((p) => p.plan === "practice" && p.billing_status === "active").length;
  const mrr = activePractice * PRACTICE_MONTHLY_PRICE_USD;

  const now = new Date();
  const months: { label: string; start: Date; end: Date }[] = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    months.push({ label: start.toLocaleDateString(undefined, { month: "short", year: "2-digit" }), start, end });
  }

  const signupsByMonth = months.map((m) => ({
    label: m.label,
    count: (practices || []).filter((p) => {
      const d = new Date(p.created_at);
      return d >= m.start && d < m.end;
    }).length,
  }));

  const churnedByMonth = months.map((m) => ({
    label: m.label,
    count: (events || []).filter((e) => {
      const d = new Date(e.occurred_at);
      return e.event_type === "subscription.canceled" && d >= m.start && d < m.end;
    }).length,
  }));

  return (
    <div className="max-w-[1000px] mx-auto py-8 px-5">
      <h1 className="text-[24px] font-semibold mb-6">Revenue</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-5">
          <div className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-2">MRR</div>
          <div className="text-[32px] font-light">${mrr.toLocaleString()}</div>
          <div className="text-[12.5px] text-gray-400 mt-1">{activePractice} active Practice-plan subscriptions</div>
        </div>
        <div className="card p-5">
          <div className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-2">Total practices</div>
          <div className="text-[32px] font-light">{practices?.length || 0}</div>
        </div>
        <div className="card p-5">
          <div className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-2">New this month</div>
          <div className="text-[32px] font-light">{signupsByMonth[signupsByMonth.length - 1]?.count || 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="card p-5">
          <h2 className="text-[13.5px] font-semibold mb-4">New signups (6 mo)</h2>
          <div className="flex items-end gap-2 h-[100px]">
            {signupsByMonth.map((m) => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t"
                  style={{ background: "var(--indigo-600)", height: `${Math.max(m.count * 14, 3)}px` }}
                />
                <span className="text-[10px] text-gray-400">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h2 className="text-[13.5px] font-semibold mb-4">Churned subscriptions (6 mo)</h2>
          <div className="flex items-end gap-2 h-[100px]">
            {churnedByMonth.map((m) => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t"
                  style={{ background: "var(--danger-red)", height: `${Math.max(m.count * 14, 3)}px` }}
                />
                <span className="text-[10px] text-gray-400">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="card p-6">
        <h2 className="text-[15px] font-semibold mb-4">Payment event log</h2>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-gray-400 text-[11px] uppercase tracking-wide">
              <th className="py-2 font-semibold">Event</th>
              <th className="py-2 font-semibold">Practice</th>
              <th className="py-2 font-semibold">When</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} style={{ borderTop: "1px solid var(--gray-200)" }}>
                <td className="py-2 font-mono text-[12px]">{e.event_type}</td>
                <td className="py-2">{e.practiceName}</td>
                <td className="py-2 text-gray-400">{new Date(e.occurred_at).toLocaleString()}</td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr><td colSpan={3} className="py-6 text-center text-gray-400">No billing events yet.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
