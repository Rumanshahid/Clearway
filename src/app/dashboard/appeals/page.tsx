import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PRACTICE_MONTHLY_PRICE_USD } from "@/lib/billing";
import AppealRow from "./AppealRow";

export default async function AppealsPage() {
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

  const { data: practice } = await supabase.from("practices").select("plan").eq("id", practiceId).single();

  const { data: denials } = await supabase
    .from("claim_denials")
    .select(
      "id, patient_id, claim_number, denial_date, denial_reason_code, payer, amount_billed, amount_denied, amount_recovered, appeal_deadline, status, priority, created_at, updated_at"
    )
    .eq("practice_id", practiceId)
    .order("created_at", { ascending: false });

  const rows = denials || [];
  const denialIds = rows.map((r) => r.id);

  const { data: letters } = denialIds.length
    ? await supabase
        .from("claim_appeal_letters")
        .select("id, claim_denial_id, version")
        .in("claim_denial_id", denialIds)
        .order("version", { ascending: false })
    : { data: [] as { id: string; claim_denial_id: string; version: number }[] };

  const latestLetterByDenial = new Map<string, string>();
  for (const letter of letters || []) {
    if (!latestLetterByDenial.has(letter.claim_denial_id)) {
      latestLetterByDenial.set(letter.claim_denial_id, letter.id);
    }
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const thisMonth = rows.filter((r) => new Date(r.created_at) >= monthStart);
  const deniedThisMonth = thisMonth.reduce((sum, r) => sum + (r.amount_denied || 0), 0);
  const recoveredThisMonth = rows
    .filter((r) => r.status === "won" && r.updated_at && new Date(r.updated_at) >= monthStart)
    .reduce((sum, r) => sum + (r.amount_recovered || 0), 0);

  const totalRecovered = rows.filter((r) => r.status === "won").reduce((sum, r) => sum + (r.amount_recovered || 0), 0);
  const decided = rows.filter((r) => r.status === "won" || r.status === "lost");
  const won = decided.filter((r) => r.status === "won").length;
  const recoveryRate = decided.length > 0 ? Math.round((won / decided.length) * 100) : null;

  const now = new Date();
  const daysSince = (d: string) => Math.floor((now.getTime() - new Date(d).getTime()) / 86400000);
  const openDenials = rows.filter((r) => r.status === "open" || r.status === "appeal_filed");
  const ageBuckets = {
    "0-30 days": openDenials.filter((r) => daysSince(r.denial_date) <= 30).length,
    "31-60 days": openDenials.filter((r) => daysSince(r.denial_date) > 30 && daysSince(r.denial_date) <= 60).length,
    "60+ days": openDenials.filter((r) => daysSince(r.denial_date) > 60).length,
  };

  const payerCounts = new Map<string, number>();
  for (const r of rows) {
    const key = r.payer || "Not specified";
    payerCounts.set(key, (payerCounts.get(key) || 0) + 1);
  }
  const topPayers = [...payerCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const codeCounts = new Map<string, number>();
  for (const r of thisMonth) {
    codeCounts.set(r.denial_reason_code, (codeCounts.get(r.denial_reason_code) || 0) + 1);
  }
  const topCodes = [...codeCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const daysUntil = (d: string) => Math.ceil((new Date(d).getTime() - now.getTime()) / 86400000);
  const deadlineAlerts = openDenials
    .filter((r) => r.appeal_deadline && daysUntil(r.appeal_deadline) <= 7)
    .sort((a, b) => new Date(a.appeal_deadline!).getTime() - new Date(b.appeal_deadline!).getTime());

  return (
    <div className="max-w-[1300px] mx-auto py-8 px-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-[20px] sm:text-[24px] font-semibold">Claims denials &amp; appeals</h1>
        <Link href="/dashboard/appeals/new" className="btn btn-primary self-start sm:self-auto">Log Denial →</Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Denied This Month" value={`$${deniedThisMonth.toLocaleString()}`} />
        <StatCard label="Recovered This Month" value={`$${recoveredThisMonth.toLocaleString()}`} accent="var(--success-green)" />
        <StatCard label="Recovery Rate" value={recoveryRate !== null ? `${recoveryRate}%` : "—"} accent="var(--indigo-600)" />
        <StatCard label="Appeals Pending" value={openDenials.length} accent="var(--amber)" />
      </div>

      <div className="card p-5 mb-6">
        <div className="text-[13px] font-semibold text-gray-900 mb-1">Total recovered through Asaanbil appeals</div>
        <div className="text-[28px] font-light" style={{ color: "var(--success-green)" }}>${totalRecovered.toLocaleString()}</div>
        {practice?.plan === "practice" && (
          <p className="text-[12.5px] text-gray-400 mt-1">
            Your Practice plan costs ${PRACTICE_MONTHLY_PRICE_USD}/month.
          </p>
        )}
      </div>

      {deadlineAlerts.length > 0 && (
        <div className="card p-5 mb-6" style={{ borderColor: "var(--danger-red)" }}>
          <div className="text-[13px] font-semibold mb-3" style={{ color: "var(--danger-red)" }}>
            Deadline alerts — within 7 days or overdue
          </div>
          <div className="flex flex-col gap-2">
            {deadlineAlerts.map((r) => {
              const days = daysUntil(r.appeal_deadline!);
              return (
                <Link
                  key={r.id}
                  href={`/dashboard/appeals/${r.id}`}
                  className="flex items-center justify-between text-[13.5px] px-3 py-2 rounded-lg"
                  style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}
                >
                  <span>{r.claim_number || "(no claim number)"} — {r.denial_reason_code}</span>
                  <span className="font-semibold">{days < 0 ? `${Math.abs(days)} days overdue` : `${days} days left`}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <div className="text-[13px] font-semibold text-gray-900 mb-3">Open denials by age</div>
          {Object.entries(ageBuckets).map(([bucket, count]) => (
            <div key={bucket} className="flex justify-between text-[13.5px] text-gray-600 py-1">
              <span>{bucket}</span><span className="font-medium text-gray-900">{count}</span>
            </div>
          ))}
        </div>
        <div className="card p-5">
          <div className="text-[13px] font-semibold text-gray-900 mb-3">Denials by payer</div>
          {topPayers.length > 0 ? topPayers.map(([payer, count]) => (
            <div key={payer} className="flex justify-between text-[13.5px] text-gray-600 py-1">
              <span>{payer}</span><span className="font-medium text-gray-900">{count}</span>
            </div>
          )) : <p className="text-[13px] text-gray-400">No denials logged yet.</p>}
        </div>
        <div className="card p-5">
          <div className="text-[13px] font-semibold text-gray-900 mb-3">Common denial codes this month</div>
          {topCodes.length > 0 ? topCodes.map(([code, count]) => (
            <div key={code} className="flex justify-between text-[13.5px] text-gray-600 py-1">
              <span>{code}</span><span className="font-medium text-gray-900">{count}</span>
            </div>
          )) : <p className="text-[13px] text-gray-400">None this month.</p>}
        </div>
      </div>

      <div className="card overflow-hidden overflow-x-auto">
        <table className="w-full text-[13.5px]">
          <thead>
            <tr className="text-left text-gray-400 text-[11px] uppercase tracking-wide" style={{ borderBottom: "1px solid var(--gray-200)" }}>
              <th className="px-5 py-3 font-semibold">Claim #</th>
              <th className="px-5 py-3 font-semibold">Denial Code</th>
              <th className="px-5 py-3 font-semibold">Payer</th>
              <th className="px-5 py-3 font-semibold">Amount Denied</th>
              <th className="px-5 py-3 font-semibold">Deadline</th>
              <th className="px-5 py-3 font-semibold">Priority</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((r) => (
                <AppealRow
                  key={r.id}
                  denialId={r.id}
                  claimNumber={r.claim_number}
                  denialReasonCode={r.denial_reason_code}
                  payer={r.payer}
                  amountDenied={r.amount_denied}
                  appealDeadline={r.appeal_deadline}
                  priority={r.priority}
                  status={r.status}
                  letterId={latestLetterByDenial.get(r.id)}
                />
              ))
            ) : (
              <tr>
                <td className="px-5 py-10 text-center text-gray-400" colSpan={8}>
                  No claim denials logged yet. <Link href="/dashboard/appeals/new" className="text-indigo-600">Log your first one →</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="card p-5">
      <div className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-2">{label}</div>
      <div className="text-[28px] font-light" style={accent ? { color: accent } : undefined}>{value}</div>
    </div>
  );
}
