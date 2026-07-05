import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/permissions";

export default async function OverviewPage() {
  const session = await requireAdmin();
  const supabase = await createClient();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [
    { data: monthRequests },
    { count: patientsCount },
    { data: denials },
    { count: membersCount },
    { data: profiles },
    { count: openTasksCount },
  ] = await Promise.all([
    supabase.from("pa_requests").select("status").eq("practice_id", session.practiceId).gte("created_at", monthStart.toISOString()),
    supabase.from("patients").select("id", { count: "exact", head: true }).eq("practice_id", session.practiceId),
    supabase
      .from("claim_denials")
      .select("amount_denied, amount_recovered, status, updated_at, created_at")
      .eq("practice_id", session.practiceId),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("practice_id", session.practiceId),
    supabase.from("profiles").select("id, full_name, role, title").eq("practice_id", session.practiceId),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("practice_id", session.practiceId)
      .neq("status", "done"),
  ]);

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

  return (
    <div className="max-w-[1300px] mx-auto py-8 px-5">
      <h1 className="text-[24px] font-semibold mb-1">Practice overview</h1>
      <p className="text-[14px] text-gray-600 mb-6">Everything happening across your practice, in one place.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-semibold">Staff</h2>
          <Link href="/dashboard/team" className="text-[12.5px] text-indigo-600 font-medium">Manage team →</Link>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-5">
          <StatCard label="Total members" value={membersCount ?? 0} />
          <StatCard label="Doctors / Admins" value={admins.length} accent="var(--indigo-600)" />
          <StatCard label="Staff" value={staff.length} accent="var(--gray-600)" />
        </div>
        <div className="flex flex-col gap-2">
          {(profiles || []).map((p) => (
            <div key={p.id} className="flex items-center justify-between text-[13.5px] py-1" style={{ borderBottom: "1px solid var(--gray-100)" }}>
              <span>{p.full_name || "(unnamed)"}{p.title ? <span className="text-gray-400"> — {p.title}</span> : null}</span>
              <span className="status-pill" style={{ background: "var(--gray-100)", color: "var(--gray-600)" }}>
                {p.role === "clinic_admin" ? "Doctor / Admin" : p.role === "super_admin" ? "Super Admin" : "Staff"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        <Link href={href} className="text-[12.5px] text-indigo-600 font-medium">Open →</Link>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function StatRow({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="flex items-center justify-between text-[13.5px]">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold" style={accent ? { color: accent } : undefined}>{value}</span>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-1">{label}</div>
      <div className="text-[24px] font-light" style={accent ? { color: accent } : undefined}>{value}</div>
    </div>
  );
}
