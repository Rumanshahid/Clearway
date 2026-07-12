import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/permissions";
import { getSiteContent, getProcedureLabelMap } from "@/lib/criteria-repo";
import { getPageBySlug, makeFieldGetter } from "@/lib/content-schema";
import { WIDGET_REGISTRY, resolveDashboardLayout } from "@/lib/dashboardWidgets";
import DashboardCustomizer from "./DashboardCustomizer";
import type { AppointmentStatus } from "@/lib/database.types";

const DASHBOARD_PAGE = getPageBySlug("dashboard")!;

// Staff is now a shared-width panel rather than the page's single biggest
// card, so it needs fewer visible pills before collapsing into "+N more".
const MAX_STAFF_PILLS = 10;

const APPT_STATUS_COLORS: Record<AppointmentStatus, { bg: string; fg: string }> = {
  confirmed: { bg: "#EEF0FF", fg: "var(--indigo-600)" },
  checked_in: { bg: "var(--amber-bg)", fg: "var(--amber)" },
  complete: { bg: "var(--success-bg)", fg: "var(--success-green)" },
  no_show: { bg: "var(--danger-bg)", fg: "var(--danger-red)" },
  cancelled: { bg: "var(--gray-100)", fg: "var(--gray-400)" },
};

const APPT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  confirmed: "Confirmed",
  checked_in: "Checked In",
  complete: "Complete",
  no_show: "No-Show",
  cancelled: "Cancelled",
};

interface AttentionItem {
  id: string;
  href: string;
  label: string;
  detail: string;
  urgent: boolean;
}

interface TodayAppointment {
  id: string;
  patient_full_name: string;
  reason_for_visit: string | null;
  status: AppointmentStatus;
  start_at: string;
  end_at: string;
  is_telehealth: boolean;
  doctor_profile_id: string;
}

interface PracticeBilling {
  plan: string;
  letters_included: number;
  letters_used_this_period: number;
  billing_status: string;
}

export default async function OverviewPage() {
  const session = await requireAdmin();
  const supabase = await createClient();
  const c = makeFieldGetter(DASHBOARD_PAGE, await getSiteContent());

  const now = new Date();

  const monthStart = new Date(now);
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const staleDraftCutoff = new Date();
  staleDraftCutoff.setDate(staleDraftCutoff.getDate() - 3);

  const [
    { data: monthRequests },
    { count: patientsCount },
    { data: denials },
    { count: membersCount },
    { data: profiles },
    { data: visibleTasks },
    { data: doctorProfiles },
    { data: todaysAppointments },
    { data: staleDrafts },
    { data: practice },
    { data: self },
    procedureLabels,
  ] = await Promise.all([
    supabase.from("pa_requests").select("status").eq("practice_id", session.practiceId).gte("created_at", monthStart.toISOString()),
    supabase.from("patients").select("id", { count: "exact", head: true }).eq("practice_id", session.practiceId),
    supabase
      .from("claim_denials")
      .select("id, claim_number, denial_reason_code, appeal_deadline, amount_denied, amount_recovered, status, updated_at, created_at")
      .eq("practice_id", session.practiceId),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("practice_id", session.practiceId),
    // RLS already limits this to team-wide tasks plus whatever the admin
    // created themselves — a doctor's overview never surfaces a staff
    // member's personal to-dos.
    supabase.from("profiles").select("id, full_name, role, title").eq("practice_id", session.practiceId),
    supabase.from("tasks").select("id").eq("practice_id", session.practiceId),
    supabase.from("doctor_profiles").select("id, profile_id").eq("practice_id", session.practiceId),
    supabase
      .from("appointments")
      .select("id, patient_full_name, reason_for_visit, status, start_at, end_at, is_telehealth, doctor_profile_id")
      .eq("practice_id", session.practiceId)
      .gte("start_at", todayStart.toISOString())
      .lt("start_at", todayEnd.toISOString())
      .neq("status", "cancelled")
      .order("start_at"),
    supabase
      .from("pa_requests")
      .select("id, patient_reference, procedure_type, created_at")
      .eq("practice_id", session.practiceId)
      .eq("status", "draft")
      .lt("created_at", staleDraftCutoff.toISOString())
      .order("created_at")
      .limit(8),
    supabase.from("practices").select("plan, letters_included, letters_used_this_period, billing_status").eq("id", session.practiceId).single(),
    supabase.from("profiles").select("dashboard_layout").eq("id", session.userId).single(),
    getProcedureLabelMap(),
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

  const nameByProfileId = new Map(allMembers.map((p) => [p.id, p.full_name || "(unnamed)"]));
  const nameByDoctorProfileId = new Map((doctorProfiles || []).map((d) => [d.id, nameByProfileId.get(d.profile_id) || "Doctor"]));
  const multipleDoctors = (doctorProfiles || []).length > 1;

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const appealAttention: AttentionItem[] = denialRows
    .filter((d) => (d.status === "open" || d.status === "appeal_filed") && d.appeal_deadline)
    .map((d) => {
      const deadline = new Date(d.appeal_deadline!);
      deadline.setHours(0, 0, 0, 0);
      const daysRemaining = Math.round((deadline.getTime() - today.getTime()) / 86400000);
      return { d, daysRemaining };
    })
    .filter(({ daysRemaining }) => daysRemaining <= 7)
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .map(({ d, daysRemaining }) => ({
      id: d.id,
      href: `/dashboard/appeals/${d.id}`,
      label: d.claim_number || "Claim appeal",
      detail:
        daysRemaining < 0
          ? `Deadline passed ${Math.abs(daysRemaining)}d ago`
          : daysRemaining === 0
            ? "Deadline today"
            : `${daysRemaining}d left to appeal`,
      urgent: daysRemaining <= 3,
    }));

  const draftAttention: AttentionItem[] = (staleDrafts || []).map((r) => ({
    id: r.id,
    href: `/dashboard/requests/${r.id}`,
    label: r.patient_reference,
    detail: `${procedureLabels[r.procedure_type] || r.procedure_type} — drafted ${Math.floor(
      (now.getTime() - new Date(r.created_at).getTime()) / 86400000
    )}d ago, not yet submitted`,
    urgent: false,
  }));

  const attentionItems = [...appealAttention, ...draftAttention];

  const { order, hiddenSet } = resolveDashboardLayout(self?.dashboard_layout);
  const visibleOrder = order.filter((k) => !hiddenSet.has(k));
  const widgetByKey = new Map(WIDGET_REGISTRY.map((w) => [w.key, w]));
  const smKeys = visibleOrder.filter((k) => widgetByKey.get(k)?.size === "sm");
  const lgKeys = visibleOrder.filter((k) => widgetByKey.get(k)?.size === "lg");

  function renderSmallWidget(key: string) {
    switch (key) {
      case "pa_requests":
        return (
          <SectionCard title="PA Requests" href="/dashboard">
            <StatRow label="This month" value={paStats.total} />
            <StatRow label="Approved" value={paStats.approved} accent="var(--success-green)" />
            <StatRow label="Pending" value={paStats.pending} accent="var(--indigo-600)" />
            <StatRow label="Denied" value={paStats.denied} accent="var(--danger-red)" />
          </SectionCard>
        );
      case "patients":
        return (
          <SectionCard title="Patients" href="/dashboard/patients">
            <StatRow label="Total on file" value={patientsCount ?? 0} />
          </SectionCard>
        );
      case "appeals":
        return (
          <SectionCard title="Appeals" href="/dashboard/appeals">
            <StatRow label="Denied this month" value={`$${deniedThisMonth.toLocaleString()}`} />
            <StatRow label="Recovered this month" value={`$${recoveredThisMonth.toLocaleString()}`} accent="var(--success-green)" />
            <StatRow label="Pending" value={pendingAppeals} accent="var(--amber)" />
            <StatRow label="Recovery rate" value={recoveryRate !== null ? `${recoveryRate}%` : "—"} accent="var(--indigo-600)" />
          </SectionCard>
        );
      case "tasks":
        return (
          <SectionCard title="Tasks" href="/dashboard/tasks">
            <StatRow label="Open tasks" value={openTasksCount ?? 0} accent="var(--amber)" />
          </SectionCard>
        );
      case "billing":
        return <BillingWidget practice={practice as PracticeBilling | null} />;
      default:
        return null;
    }
  }

  function renderLargeWidget(key: string) {
    switch (key) {
      case "schedule":
        return (
          <ScheduleWidget
            appointments={(todaysAppointments || []) as TodayAppointment[]}
            multipleDoctors={multipleDoctors}
            nameByDoctorProfileId={nameByDoctorProfileId}
          />
        );
      case "attention":
        return <AttentionWidget items={attentionItems} />;
      case "staff":
        return (
          <StaffWidget
            admins={admins}
            staff={staff}
            visibleMembers={visibleMembers}
            hiddenCount={hiddenCount}
            membersCount={membersCount ?? 0}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="max-w-[1300px] mx-auto px-5 py-4 flex flex-col gap-3 overflow-hidden" style={{ height: "calc(100vh - 57px)" }}>
      <div className="flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-baseline gap-3 min-w-0">
          <h1 className="text-[19px] font-semibold">{c("dashboard_h1")}</h1>
          <p className="text-[12.5px] text-gray-400 truncate">{c("dashboard_subtitle")}</p>
        </div>
        <DashboardCustomizer registry={WIDGET_REGISTRY} initialOrder={order} initialHidden={Array.from(hiddenSet)} />
      </div>

      {smKeys.length > 0 && (
        <div className="grid gap-3 flex-shrink-0" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          {smKeys.map((key) => (
            <div key={key}>{renderSmallWidget(key)}</div>
          ))}
        </div>
      )}

      {lgKeys.length > 0 && (
        <div className="grid gap-3 flex-1 min-h-0" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {lgKeys.map((key) => (
            <div key={key} className="min-h-0">
              {renderLargeWidget(key)}
            </div>
          ))}
        </div>
      )}

      {smKeys.length === 0 && lgKeys.length === 0 && (
        <div className="card p-6 text-center text-gray-400 flex-1">
          Every panel is hidden. Open Customize to bring some back.
        </div>
      )}
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

function BillingWidget({ practice }: { practice: PracticeBilling | null }) {
  if (!practice) return null;
  const pct = practice.letters_included > 0 ? Math.round((practice.letters_used_this_period / practice.letters_included) * 100) : 0;
  return (
    <SectionCard title="Plan usage" href="/dashboard/billing">
      <StatRow label="Plan" value={practice.plan} />
      <StatRow
        label="Letters used"
        value={`${practice.letters_used_this_period} / ${practice.letters_included}`}
        accent={pct >= 90 ? "var(--danger-red)" : pct >= 70 ? "var(--amber)" : undefined}
      />
      {practice.billing_status !== "active" && <StatRow label="Status" value={practice.billing_status} accent="var(--danger-red)" />}
    </SectionCard>
  );
}

function ScheduleWidget({
  appointments,
  multipleDoctors,
  nameByDoctorProfileId,
}: {
  appointments: TodayAppointment[];
  multipleDoctors: boolean;
  nameByDoctorProfileId: Map<string, string>;
}) {
  return (
    <div className="card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h2 className="text-[14px] font-semibold">Today&apos;s Schedule</h2>
        <Link href="/dashboard/appointments" className="text-[12px] text-indigo-600 font-medium">Open →</Link>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1.5">
        {appointments.length === 0 && <p className="text-[12.5px] text-gray-400">Nothing scheduled today.</p>}
        {appointments.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-2 text-[12.5px] rounded-lg px-2.5 py-1.5" style={{ background: "var(--gray-50)" }}>
            <div className="min-w-0">
              <div className="font-medium text-gray-900 truncate">
                {new Date(a.start_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} — {a.patient_full_name}
              </div>
              <div className="text-gray-400 truncate">
                {a.reason_for_visit || "No reason given"}
                {multipleDoctors && ` · ${nameByDoctorProfileId.get(a.doctor_profile_id) || "Doctor"}`}
                {a.is_telehealth && " · Telehealth"}
              </div>
            </div>
            <span
              className="status-pill flex-shrink-0"
              style={{ background: APPT_STATUS_COLORS[a.status].bg, color: APPT_STATUS_COLORS[a.status].fg }}
            >
              {APPT_STATUS_LABELS[a.status]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AttentionWidget({ items }: { items: AttentionItem[] }) {
  return (
    <div className="card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h2 className="text-[14px] font-semibold">Needs Attention</h2>
        <span className="text-[12px] text-gray-400">{items.length}</span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1.5">
        {items.length === 0 && <p className="text-[12.5px] text-gray-400">Nothing urgent — you&apos;re caught up.</p>}
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="flex items-center justify-between gap-2 text-[12.5px] rounded-lg px-2.5 py-1.5"
            style={{ background: item.urgent ? "var(--danger-bg)" : "var(--amber-bg)" }}
          >
            <span className="font-medium truncate" style={{ color: item.urgent ? "var(--danger-red)" : "var(--amber)" }}>
              {item.label}
            </span>
            <span className="text-gray-600 flex-shrink-0">{item.detail}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StaffWidget({
  admins,
  staff,
  visibleMembers,
  hiddenCount,
  membersCount,
}: {
  admins: { id: string }[];
  staff: { id: string }[];
  visibleMembers: { id: string; full_name: string | null; role: string; title: string | null }[];
  hiddenCount: number;
  membersCount: number;
}) {
  return (
    <div className="card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <h2 className="text-[14px] font-semibold">Staff</h2>
          <span className="text-[11.5px] text-gray-400">
            {membersCount} total · <span style={{ color: "var(--indigo-600)" }}>{admins.length} Doctors/Admins</span> ·{" "}
            <span className="text-gray-600">{staff.length} Staff</span>
          </span>
        </div>
        <Link href="/dashboard/team" className="text-[12px] text-indigo-600 font-medium flex-shrink-0">Manage →</Link>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-wrap content-start gap-2">
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
  );
}
