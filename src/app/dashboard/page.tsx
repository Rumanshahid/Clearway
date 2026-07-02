import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PAYERS } from "@/lib/criteria";
import { getProcedureLabelMap } from "@/lib/criteria-repo";
import type { RequestStatus } from "@/lib/database.types";
import StatusSelect from "./StatusSelect";

const STATUS_STYLES: Record<RequestStatus, { bg: string; color: string; label: string }> = {
  draft: { bg: "var(--gray-100)", color: "var(--gray-600)", label: "Draft" },
  reviewed: { bg: "#EEF0FF", color: "var(--indigo-600)", label: "Reviewed" },
  submitted: { bg: "var(--amber-bg)", color: "var(--amber)", label: "Submitted" },
  approved: { bg: "var(--success-bg)", color: "var(--success-green)", label: "Approved" },
  denied: { bg: "var(--danger-bg)", color: "var(--danger-red)", label: "Denied" },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; payer?: string; procedure?: string; from?: string; to?: string; drafted?: string }>;
}) {
  const { status, payer, procedure, from, to, drafted } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("practice_id")
    .eq("id", user!.id)
    .single();

  const practiceId = profile!.practice_id!;

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

  const [{ data: requests }, procedureLabels] = await Promise.all([query, getProcedureLabelMap()]);

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

  const hasFilters = status || payer || procedure || from || to;

  return (
    <div className="max-w-[1300px] mx-auto py-8 px-5">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px] font-semibold">Prior authorization requests</h1>
        <Link href="/dashboard/requests/new" className="btn btn-primary">New Request →</Link>
      </div>

      {drafted && (
        <div
          className="mb-6 text-[13.5px] rounded-lg px-4 py-3"
          style={{ background: "var(--success-bg)", color: "var(--success-green)" }}
        >
          ✓ Letter drafted for <strong>{drafted}</strong> — find it in the table below.
        </div>
      )}

      <div className="flex gap-6 items-start">
        <aside className="w-[230px] flex-shrink-0">
          <form className="card p-4 flex flex-col gap-4" method="get">
            <h2 className="text-[13px] font-semibold text-gray-600">Filters</h2>
            <FilterSelect name="status" label="Status" defaultValue={status} options={Object.entries(STATUS_STYLES).map(([k, v]) => [k, v.label])} />
            <FilterSelect name="payer" label="Payer" defaultValue={payer} options={PAYERS.map((p) => [p.key, p.label])} />
            <FilterSelect name="procedure" label="Procedure" defaultValue={procedure} options={Object.entries(procedureLabels)} />
            <div>
              <label className="label" htmlFor="from">From</label>
              <input className="input" type="date" id="from" name="from" defaultValue={from} />
            </div>
            <div>
              <label className="label" htmlFor="to">To</label>
              <input className="input" type="date" id="to" name="to" defaultValue={to} />
            </div>
            <button className="btn btn-outline btn-sm" type="submit">Apply</button>
            {hasFilters && (
              <Link href="/dashboard" className="text-[12.5px] text-gray-400">Clear filters</Link>
            )}
          </form>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard label="This Month" value={stats.total} />
            <StatCard label="Approved" value={stats.approved} accent="var(--success-green)" />
            <StatCard label="Pending" value={stats.pending} accent="var(--indigo-600)" />
            <StatCard label="Denied" value={stats.denied} accent="var(--danger-red)" />
          </div>

          <div className="card overflow-hidden">
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
                  requests.map((r) => {
                    const procLabel = procedureLabels[r.procedure_type] || r.procedure_type;
                    const letterId = latestLetterByRequest.get(r.id);
                    return (
                      <tr key={r.id} className="hover:bg-gray-50" style={{ borderBottom: "1px solid var(--gray-200)" }}>
                        <td className="px-5 py-3">
                          <Link href={`/dashboard/requests/${r.id}`} className="block">{r.patient_reference}</Link>
                        </td>
                        <td className="px-5 py-3">{procLabel}</td>
                        <td className="px-5 py-3 capitalize">{r.payer.replace(/_/g, " ")}</td>
                        <td className="px-5 py-3">
                          <StatusSelect requestId={r.id} status={r.status as RequestStatus} />
                        </td>
                        <td className="px-5 py-3 text-gray-400">{new Date(r.created_at).toLocaleDateString()}</td>
                        <td className="px-5 py-3">
                          {letterId ? (
                            <a href={`/api/letters/${letterId}/pdf`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 text-[12.5px]">
                              Download
                            </a>
                          ) : (
                            <span className="text-gray-400 text-[12.5px]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="px-5 py-10 text-center text-gray-400" colSpan={6}>
                      No requests yet. <Link href="/dashboard/requests/new" className="text-indigo-600">Create your first one →</Link>
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

function FilterSelect({
  name,
  label,
  defaultValue,
  options,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  options: [string, string][];
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <select className="input" id={name} name={name} defaultValue={defaultValue || ""}>
        <option value="">All</option>
        {options.map(([value, l]) => (
          <option key={value} value={value}>{l}</option>
        ))}
      </select>
    </div>
  );
}
