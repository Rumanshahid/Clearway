import { createAdminClient } from "@/lib/supabase/server";
import { PRACTICE_MONTHLY_PRICE_USD } from "@/lib/billing";

// Full cross-platform snapshot for the super_admin -- counts across every
// major table plus a few 6-month trend charts. Uses the admin (service-role)
// client since this deliberately reads across every practice/patient/user's
// data, which no single RLS-scoped session is allowed to see.
async function countOf(supabase: Awaited<ReturnType<typeof createAdminClient>>, table: string) {
  const { count } = await supabase.from(table).select("id", { count: "exact", head: true });
  return count || 0;
}

function monthBuckets() {
  const now = new Date();
  const months: { label: string; start: Date; end: Date }[] = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    months.push({ label: start.toLocaleDateString(undefined, { month: "short", year: "2-digit" }), start, end });
  }
  return months;
}

function bucketByMonth(rows: { created_at: string }[], months: ReturnType<typeof monthBuckets>) {
  return months.map((m) => ({
    label: m.label,
    count: rows.filter((r) => {
      const d = new Date(r.created_at);
      return d >= m.start && d < m.end;
    }).length,
  }));
}

function BarChart({ title, data, color }: { title: string; data: { label: string; count: number }[]; color: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="card p-5">
      <h2 className="text-[13.5px] font-semibold mb-4">{title}</h2>
      <div className="flex items-end gap-2 h-[100px]">
        {data.map((d) => (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-t" style={{ background: color, height: `${Math.max((d.count / max) * 90, 3)}px` }} />
            <span className="text-[10px] text-gray-400">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatTile({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="card p-5">
      <div className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-2">{label}</div>
      <div className="text-[28px] font-light">{typeof value === "number" ? value.toLocaleString() : value}</div>
      {sub && <div className="text-[12px] text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

export default async function AdminAnalyticsPage() {
  const supabase = await createAdminClient();
  const months = monthBuckets();

  const [
    practiceCount,
    staffCount,
    practicePatientCount,
    paRequestCount,
    claimAppealCount,
    appointmentCount,
    blogPostCount,
    blogCommentCount,
    questionCount,
    answerCount,
    { data: practices },
    { data: blogPosts },
    { data: questions },
  ] = await Promise.all([
    countOf(supabase, "practices"),
    countOf(supabase, "profiles"),
    countOf(supabase, "patients"),
    countOf(supabase, "pa_requests"),
    countOf(supabase, "claim_appeal_letters"),
    countOf(supabase, "appointments"),
    countOf(supabase, "blog_posts"),
    countOf(supabase, "blog_comments"),
    countOf(supabase, "questions"),
    countOf(supabase, "answers"),
    supabase.from("practices").select("id, plan, billing_status, created_at"),
    supabase.from("blog_posts").select("id, created_at, status").eq("status", "published"),
    supabase.from("questions").select("id, created_at"),
  ]);

  const activePractices = (practices || []).filter((p) => p.plan === "practice" && p.billing_status === "active").length;
  const mrr = activePractices * PRACTICE_MONTHLY_PRICE_USD;

  const practiceSignups = bucketByMonth(practices || [], months);
  const blogActivity = bucketByMonth(blogPosts || [], months);
  const qaActivity = bucketByMonth(questions || [], months);

  return (
    <div className="max-w-[1200px] mx-auto py-8 px-5">
      <h1 className="text-[24px] font-semibold mb-1">Analytics</h1>
      <p className="text-[14px] text-gray-500 mb-6">A cross-platform snapshot of everything happening on asaanbil.com.</p>

      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-gray-400 mb-3">Business</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatTile label="MRR" value={`$${mrr.toLocaleString()}`} sub={`${activePractices} active subscriptions`} />
        <StatTile label="Practices" value={practiceCount} />
        <StatTile label="Staff accounts" value={staffCount} />
      </div>

      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-gray-400 mb-3">Clinical activity</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatTile label="Patients on file" value={practicePatientCount} sub="Across all practices" />
        <StatTile label="Prior-auth requests" value={paRequestCount} />
        <StatTile label="Claim appeal letters" value={claimAppealCount} />
        <StatTile label="Appointments booked" value={appointmentCount} />
      </div>

      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-gray-400 mb-3">Community</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatTile label="Blog posts" value={blogPostCount} />
        <StatTile label="Blog comments" value={blogCommentCount} />
        <StatTile label="Questions asked" value={questionCount} />
        <StatTile label="Answers posted" value={answerCount} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <BarChart title="New practices (6 mo)" data={practiceSignups} color="var(--indigo-600)" />
        <BarChart title="Blog posts published (6 mo)" data={blogActivity} color="var(--success-green)" />
        <BarChart title="Questions asked (6 mo)" data={qaActivity} color="var(--amber)" />
      </div>
    </div>
  );
}
