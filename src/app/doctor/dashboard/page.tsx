import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireSectionAccess } from "@/lib/permissions";
import { PAYERS } from "@/lib/criteria";
import { getProcedureLabelMap, getSiteContent } from "@/lib/criteria-repo";
import { getPageBySlug, makeFieldGetter } from "@/lib/content-schema";
import type { RequestStatus } from "@/lib/database.types";
import RequestRow from "@/app/dashboard/RequestRow";
import FiltersDropdown from "@/app/dashboard/FiltersDropdown";

const PA_PAGE = getPageBySlug("pa")!;

const STATUS_STYLES: Record<RequestStatus, { label: string }> = {
  draft: { label: "Draft" },
  reviewed: { label: "Reviewed" },
  submitted: { label: "Submitted" },
  approved: { label: "Approved" },
  denied: { label: "Denied" },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; payer?: string; procedure?: string; from?: string; to?: string; drafted?: string }>;
}) {
  const { status, payer, procedure, from, to, drafted } = await searchParams;
  // Home doubles as the PA-requests section — staff without it get bounced
  // to their first permitted section by the guard.
  const session = await requireSectionAccess("requests");
  const supabase = await createClient();

  const practiceId = session.practiceId;

  let query = supabase
    .from("pa_requests")
    .select("id, patient_reference, procedure_type, payer, status, created_at")
    .eq("practice_id", practiceId)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status as RequestStatus);
  if (payer) query = query.eq("payer", payer);
  if (procedure) query = query.eq("procedure_type", procedure);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", `${to}T23:59:59`);

  const [{ data: requests }, procedureLabels, siteContent] = await Promise.all([query, getProcedureLabelMap(), getSiteContent()]);
  const c = makeFieldGetter(PA_PAGE, siteContent);

  const requestIds = (requests || []).map((r) => r.id);
  const { data: letters } = requestIds.length
    ? await supabase
        .from("letters")
        .select("id, pa_request_id, version")
        .in("pa_request_id", requestIds)
        .order("version", { ascending: false })
    : { data: [] as { id: string; pa_request_id: string; version: number }[] };

  const latestLetterByRequest = new Map<string, string>();
  for (const letter of letters || []) {
    if (!latestLetterByRequest.has(letter.pa_request_id)) {
      latestLetterByRequest.set(letter.pa_request_id, letter.id);
    }
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { data: monthRequests } = await supabase
    .from("pa_requests")
    .select("status")
    .eq("practice_id", practiceId)
    .gte("created_at", monthStart.toISOString());

  const stats = {
    total: monthRequests?.length ?? 0,
    approved: monthRequests?.filter((r) => r.status === "approved").length ?? 0,
    pending: monthRequests?.filter((r) => r.status === "draft" || r.status === "reviewed" || r.status === "submitted").length ?? 0,
    denied: monthRequests?.filter((r) => r.status === "denied").length ?? 0,
  };

  return (
    <div className="max-w-[1300px] mx-auto py-8 px-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-[20px] sm:text-[24px] font-semibold">{c("pa_h1")}</h1>
        <Link href="/dashboard/requests/new" className="btn btn-primary self-start sm:self-auto">{c("pa_new_button")} →</Link>
      </div>

      {drafted && (
        <div
          className="mb-6 text-[13.5px] rounded-lg px-4 py-3"
          style={{ background: "var(--success-bg)", color: "var(--success-green)" }}
        >
          ✓ Letter drafted for <strong>{drafted}</strong> — find it in the table below.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="This Month" value={stats.total} />
        <StatCard label="Approved" value={stats.approved} accent="var(--success-green)" />
        <StatCard label="Pending" value={stats.pending} accent="var(--indigo-600)" />
        <StatCard label="Denied" value={stats.denied} accent="var(--danger-red)" />
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <FiltersDropdown
          status={status}
          payer={payer}
          procedure={procedure}
          from={from}
          to={to}
          statusOptions={Object.entries(STATUS_STYLES).map(([k, v]) => [k, v.label])}
          payerOptions={PAYERS.map((p) => [p.key, p.label])}
          procedureOptions={Object.entries(procedureLabels)}
        />

        <div className="flex-1 min-w-0 w-full">
          <div className="card overflow-hidden overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="text-left text-gray-400 text-[11px] uppercase tracking-wide" style={{ borderBottom: "1px solid var(--gray-200)" }}>
                  <th className="px-5 py-3 font-semibold">Patient Ref</th>
                  <th className="px-5 py-3 font-semibold">Procedure</th>
                  <th className="px-5 py-3 font-semibold">Payer</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Created</th>
                  <th className="px-5 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {requests && requests.length > 0 ? (
                  requests.map((r) => (
                    <RequestRow
                      key={r.id}
                      requestId={r.id}
                      patientReference={r.patient_reference}
                      procedureLabel={procedureLabels[r.procedure_type] || r.procedure_type}
                      payer={r.payer}
                      status={r.status as RequestStatus}
                      createdAt={r.created_at}
                      letterId={latestLetterByRequest.get(r.id)}
                    />
                  ))
                ) : (
                  <tr>
                    <td className="px-5 py-10 text-center text-gray-400" colSpan={6}>
                      {c("pa_empty_state")} <Link href="/dashboard/requests/new" className="text-indigo-600">{c("pa_empty_cta")} →</Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="card p-5">
      <div className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-2">{label}</div>
      <div className="text-[32px] font-light" style={accent ? { color: accent } : undefined}>{value}</div>
    </div>
  );
}
