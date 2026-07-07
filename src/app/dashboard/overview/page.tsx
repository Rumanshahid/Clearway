import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/permissions";
import { getSiteContent } from "@/lib/criteria-repo";
import { getPageBySlug, makeFieldGetter } from "@/lib/content-schema";

const DASHBOARD_PAGE = getPageBySlug("dashboard")!;

// Practices vary a lot in headcount — this keeps the staff list from ever
// forcing the page to scroll or grow past one screen. Past this many, the
// rest collapse into a single "+N more" pill linking to the full Team page
// instead of being listed out.
const MAX_STAFF_PILLS = 14;

export default async function OverviewPage() {
  const session = await requireAdmin();
  const supabase = await createClient();
  const c = makeFieldGetter(DASHBOARD_PAGE, await getSiteContent());

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [
    { data: monthRequests },
    { count: patientsCount },
    { data: denials },
    { count: membersCount },
    { data: profiles },
    { data: visibleTasks },
  ] = await Promise.all([
    supabase.from("pa_requests").select("status").eq("practice_id", session.practiceId).gte("created_at", monthStart.toISOString()),
    supabase.from("patients").select("id", { count: "exact", head: true }).eq("practice_id", session.practiceId),
    supabase
      .from("claim_denials")
      .select("amount_denied, amount_recovered, status, updated_at, created_at")
      .eq("practice_id", session.practiceId),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("practice_id", session.practiceId),
    supabase.from("profiles").select("id, full_name, role, title").eq("practice_id", session.practiceId),
    // RLS already limits this to team-wide tasks plus whatever the admin
    // created themselves — a doctor's overview never surfaces a staff
    // member's personal to-dos.
    supabase.from("tasks").select("id").eq("practice_id", session.practiceId),
  ]);

  const taskIds = (visibleTasks || []).map((t) => t.id);
  const { data: taskCompletions } = taskIds.length
    ? await supabase.from("task_completions").select("task_id").in("task_id", taskIds)
    : { data: [] as { task_id: string }[] };
  const completedTaskIds = new Set((taskCompletions || []).map((c) => c.task_id));
  const openTasksCount = (visibleTasks || []).filter((t) => !completedTaskIds.has(t.id)).length;

  const paStats = {
    total: monthRequests?.length ?? 0,
    approved: monthRequests?.filter((r) => r.status === "approved").length ?? 0,
    pending: monthRequests?.filter((r) => r.status === "draft" || r.status === "reviewed" || r.status === "submitted").length ?? 0,
    denied: monthRequests?.filter((r) => r.status === "denied").length ?? 0,
  };

  const denialRows = denials || [];
  const deniedThisMonth = denialRows
    .filter((d) => new Date(d.created_at) >= monthStart)
    .reduce((sum, d) => sum + (d.amount_denied || 0), 0);
  const recoveredThisMonth = denialRows
    .filter((d) => d.status === "won" && d.updated_at && new Date(d.updated_at) >= monthStart)
    .reduce((sum, d) => sum + (d.amount_recovered || 0), 0);
  const pendingAppeals = denialRows.filter((d) => d.status === "open" || d.status === "appeal_filed").length;
  const decided = denialRows.filter((d) => d.status === "won" || d.status === "lost");
  const recoveryRate = decided.length > 0 ? Math.round((decided.filter((d) => d.status === "won").length / decided.length) * 100) : null;

  const admins = (profiles || []).filter((p) => p.role === "clinic_admin" || p.role === "super_admin");
  const staff = (profiles || []).filter((p) => p.role === "clinic_user");
  const allMembers = profiles || [];
  const visibleMembers = allMembers.slice(0, MAX_STAFF_PILLS);
  const hiddenCount = allMembers.length - visibleMembers.length;

  return (
    <div className="max-w-[1300px] mx-auto px-5 py-4 flex flex-col gap-3 overflow-hidden" style={{ height: "calc(100vh - 57px)" }}>
      <div className="flex items-baseline justify-between gap-4 flex-shrink-0">
        <h1 className="text-[19px] font-semibold">{c("dashboard_h1")}</h1>
        <p className="text-[12.5px] text-gray-400">{c("dashboard_subtitle")}</p>
      </div>

      <div className="grid grid-cols-4 gap-3 flex-shrink-0">
        <SectionCard title="PA Requests" href="/dashboard">
          <StatRow label="This month" value={paStats.total} />
          <StatRow label="Approved" value={paStats.approved} accent="var(--success-green)" />
          <StatRow label="Pending" value={paStats.pending} accent="var(--indigo-600)" />
          <StatRow label="Denied" value={paStats.denied} accent="var(--danger-red)" />
        </SectionCard>

        <SectionCard title="Patients" href="/dashboard/patients">
          <StatRow label="Total on file" value={patientsCount ?? 0} />
        </SectionCard>

        <SectionCard title="Appeals" href="/dashboard/appeals">
          <StatRow label="Denied this month" value={`$${deniedThisMonth.toLocaleString()}`} />
          <StatRow label="Recovered this month" value={`$${recoveredThisMonth.toLocaleString()}`} accent="var(--success-green)" />
          <StatRow label="Pending" value={pendingAppeals} accent="var(--amber)" />
          <StatRow label="Recovery rate" value={recoveryRate !== null ? `${recoveryRate}%` : "—"} accent="var(--indigo-600)" />
        </SectionCard>

        <SectionCard title="Tasks" href="/dashboard/tasks">
          <StatRow label="Open tasks" value={openTasksCount ?? 0} accent="var(--amber)" />
        </SectionCard>
      </div>

      <div className="card p-4 flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-[14px] font-semibold">Staff</h2>
            <span className="text-[12px] text-gray-400">
              {membersCount ?? 0} total · <span style={{ color: "var(--indigo-600)" }}>{admins.length} Doctors/Admins</span> ·{" "}
              <span className="text-gray-600">{staff.length} Staff</span>
            </span>
          </div>
          <Link href="/dashboard/team" className="text-[12.5px] text-indigo-600 font-medium flex-shrink-0">Manage team →</Link>
        </div>
        <div className="flex flex-wrap gap-2 content-start overflow-hidden">
          {visibleMembers.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-1.5 text-[12.5px] rounded-full pl-1 pr-2.5 py-1"
              style={{ background: "var(--gray-50)", border: "1px solid var(--gray-200)" }}
            >
              <span
                className="w-[6px] h-[6px] rounded-full flex-shrink-0 ml-1"
                style={{ background: p.role === "clinic_user" ? "var(--gray-400)" : "var(--indigo-600)" }}
              />
              <span className="text-gray-900">{p.full_name || "(unnamed)"}</span>
              {p.title && <span className="text-gray-400">— {p.title}</span>}
            </div>
          ))}
          {hiddenCount > 0 && (
            <Link
              href="/dashboard/team"
              className="flex items-center text-[12.5px] rounded-full px-2.5 py-1 text-indigo-600 font-medium"
              style={{ background: "var(--gray-50)", border: "1px solid var(--gray-200)" }}
            >
              +{hiddenCount} more →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <div className="card p-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[13px] font-semibold">{title}</h2>
        <Link href={href} className="text-[11.5px] text-indigo-600 font-medium">Open →</Link>
      </div>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

function StatRow({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="flex items-center justify-between text-[12.5px]">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold" style={accent ? { color: accent } : undefined}>{value}</span>
    </div>
  );
}
