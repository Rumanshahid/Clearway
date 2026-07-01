import { createClient } from "@/lib/supabase/server";
import { PRACTICE_MONTHLY_PRICE_USD } from "@/lib/billing";
import UpgradeButton from "./UpgradeButton";
import { cancelSubscriptionAction } from "./actions";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; upgraded?: string }>;
}) {
  const { error, upgraded } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("practice_id")
    .eq("id", user!.id)
    .single();

  const { data: practice } = await supabase
    .from("practices")
    .select("*")
    .eq("id", profile!.practice_id!)
    .single();

  const { data: events } = await supabase
    .from("billing_events")
    .select("*")
    .eq("practice_id", profile!.practice_id!)
    .order("occurred_at", { ascending: false })
    .limit(20);

  if (!practice) return null;

  const usagePercent = Math.min(100, Math.round((practice.letters_used_this_period / practice.letters_included) * 100));

  return (
    <div className="max-w-[760px] mx-auto py-8 px-5">
      <h1 className="text-[24px] font-semibold mb-6">Billing</h1>

      {upgraded && (
        <div className="mb-5 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--success-bg)", color: "var(--success-green)" }}>
          Checkout complete — your plan will update once Paddle confirms the subscription (usually a few seconds).
        </div>
      )}
      {error && (
        <div className="mb-5 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
          {error}
        </div>
      )}

      <section className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-1">Current plan</div>
            <div className="text-[20px] font-semibold capitalize">{practice.plan.replace("_", " ")}</div>
          </div>
          <span
            className="status-pill"
            style={
              practice.billing_status === "active"
                ? { background: "var(--success-bg)", color: "var(--success-green)" }
                : practice.billing_status === "grace_period"
                  ? { background: "var(--amber-bg)", color: "var(--amber)" }
                  : { background: "var(--danger-bg)", color: "var(--danger-red)" }
            }
          >
            {practice.billing_status.replace("_", " ")}
          </span>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-[13px] text-gray-600 mb-1">
            <span>Letters used this period</span>
            <span>{practice.letters_used_this_period} / {practice.letters_included >= 999999 ? "Unlimited" : practice.letters_included}</span>
          </div>
          {practice.letters_included < 999999 && (
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${usagePercent}%` }} />
            </div>
          )}
        </div>

        {practice.plan === "pilot" && (
          <UpgradeButton practiceId={practice.id} email={user!.email || ""} />
        )}

        {practice.plan === "practice" && practice.paddle_subscription_id && practice.billing_status === "active" && (
          <form action={cancelSubscriptionAction}>
            <input type="hidden" name="practice_id" value={practice.id} />
            <input type="hidden" name="subscription_id" value={practice.paddle_subscription_id} />
            <button className="btn btn-outline btn-sm" type="submit">Cancel subscription (ends at period end)</button>
          </form>
        )}

        {practice.plan === "multi_site" && (
          <p className="text-[13px] text-gray-400">Multi-Site plans are managed directly — contact hello@clearway.health.</p>
        )}
      </section>

      <section className="card p-6">
        <h2 className="text-[15px] font-semibold mb-4">Billing history</h2>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-gray-400 text-[11px] uppercase tracking-wide">
              <th className="py-2 font-semibold">Event</th>
              <th className="py-2 font-semibold">When</th>
            </tr>
          </thead>
          <tbody>
            {(events || []).map((e) => (
              <tr key={e.id} style={{ borderTop: "1px solid var(--gray-200)" }}>
                <td className="py-2 font-mono text-[12px]">{e.event_type}</td>
                <td className="py-2 text-gray-400">{new Date(e.occurred_at).toLocaleString()}</td>
              </tr>
            ))}
            {(!events || events.length === 0) && (
              <tr><td colSpan={2} className="py-6 text-center text-gray-400">No billing activity yet.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      <p className="text-[12px] text-gray-400 mt-4">Practice plan: ${PRACTICE_MONTHLY_PRICE_USD}/mo, billed monthly via Paddle. Invoices are emailed by Paddle after each charge.</p>
    </div>
  );
}
