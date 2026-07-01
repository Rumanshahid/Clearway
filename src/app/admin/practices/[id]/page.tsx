import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resetUsageAction, updatePracticeAction } from "../actions";

export default async function AdminPracticeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: practice } = await supabase.from("practices").select("*").eq("id", id).single();
  if (!practice) notFound();

  const { data: requests } = await supabase
    .from("pa_requests")
    .select("id, patient_reference, procedure_type, payer, status, created_at")
    .eq("practice_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="max-w-[900px] mx-auto py-8 px-5">
      <Link href="/admin/practices" className="text-[13px] text-gray-400 mb-3 inline-block">← Back to practices</Link>
      <h1 className="text-[24px] font-semibold mb-6">{practice.name}</h1>

      <section className="card p-6 mb-6">
        <form action={updatePracticeAction} className="grid grid-cols-4 gap-4 items-end">
          <input type="hidden" name="id" value={practice.id} />
          <div>
            <label className="label" htmlFor="plan">Plan</label>
            <select className="input" id="plan" name="plan" defaultValue={practice.plan}>
              <option value="pilot">Pilot</option>
              <option value="practice">Practice</option>
              <option value="multi_site">Multi-Site</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="billing_status">Billing status</label>
            <select className="input" id="billing_status" name="billing_status" defaultValue={practice.billing_status}>
              <option value="active">Active</option>
              <option value="grace_period">Grace period</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="letters_included">Letters included</label>
            <input className="input" id="letters_included" name="letters_included" type="number" defaultValue={practice.letters_included} />
          </div>
          <div>
            <label className="label" htmlFor="retention_months">Data retention (months)</label>
            <input className="input" id="retention_months" name="retention_months" type="number" min={1} defaultValue={practice.retention_months} />
          </div>
          <button className="btn btn-primary col-span-4 justify-center" type="submit">Save changes</button>
        </form>

        <div className="flex items-center justify-between mt-5 pt-5" style={{ borderTop: "1px solid var(--gray-200)" }}>
          <span className="text-[13.5px] text-gray-600">
            Usage this period: {practice.letters_used_this_period} / {practice.letters_included}
          </span>
          <form action={resetUsageAction}>
            <input type="hidden" name="id" value={practice.id} />
            <button className="btn btn-outline btn-sm" type="submit">Reset usage counter</button>
          </form>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-[15px] font-semibold mb-4">Recent PA requests (de-identified, read-only)</h2>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-gray-400 text-[11px] uppercase tracking-wide">
              <th className="py-2 font-semibold">Patient Ref</th>
              <th className="py-2 font-semibold">Procedure</th>
              <th className="py-2 font-semibold">Payer</th>
              <th className="py-2 font-semibold">Status</th>
              <th className="py-2 font-semibold">Created</th>
            </tr>
          </thead>
          <tbody>
            {(requests || []).map((r) => (
              <tr key={r.id} style={{ borderTop: "1px solid var(--gray-200)" }}>
                <td className="py-2">{r.patient_reference}</td>
                <td className="py-2">{r.procedure_type}</td>
                <td className="py-2 capitalize">{r.payer.replace(/_/g, " ")}</td>
                <td className="py-2 capitalize">{r.status}</td>
                <td className="py-2 text-gray-400">{new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {(!requests || requests.length === 0) && (
              <tr><td colSpan={5} className="py-6 text-center text-gray-400">No requests yet.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
