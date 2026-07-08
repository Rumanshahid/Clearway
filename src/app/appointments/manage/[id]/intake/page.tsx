import { notFound } from "next/navigation";
import "../../../../landing.css";
import SiteNav from "../../../../SiteNav";
import SiteFooter from "../../../../SiteFooter";
import { createAdminClient } from "@/lib/supabase/server";
import { submitPreVisitIntakeAction } from "./actions";

export const metadata = { title: "Pre-Visit Form — asaanbil.com" };

export default async function PreVisitIntakePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { id } = await params;
  const { submitted } = await searchParams;
  const supabase = await createAdminClient();

  const { data: appointment } = await supabase.from("appointments").select("id").eq("id", id).maybeSingle();
  if (!appointment) notFound();

  const { data: existing } = await supabase
    .from("pre_appointment_intake")
    .select("symptoms, medical_history, current_medications")
    .eq("appointment_id", id)
    .maybeSingle();

  return (
    <div className="landing-root">
      <SiteNav />
      <div className="wrap" style={{ padding: "48px 40px 80px", maxWidth: 560 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Before your visit</h1>
        <p style={{ fontSize: 13.5, color: "var(--gray-600)", marginBottom: 20 }}>
          A few quick details for the doctor — this saves time in the waiting room.
        </p>

        {submitted && (
          <div className="mb-5 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--success-bg)", color: "var(--success-green)" }}>
            Thanks — your answers were sent to the office. You can update them any time before your visit.
          </div>
        )}

        <form action={submitPreVisitIntakeAction} className="card p-6 flex flex-col gap-4">
          <input type="hidden" name="appointment_id" value={id} />
          <div>
            <label className="label">Current symptoms</label>
            <textarea className="input" name="symptoms" rows={3} defaultValue={existing?.symptoms || ""} />
          </div>
          <div>
            <label className="label">Relevant medical history</label>
            <textarea className="input" name="medical_history" rows={3} defaultValue={existing?.medical_history || ""} />
          </div>
          <div>
            <label className="label">Current medications</label>
            <textarea className="input" name="current_medications" rows={3} defaultValue={existing?.current_medications || ""} />
          </div>
          <button type="submit" className="btn btn-primary self-start">Submit</button>
        </form>
      </div>
      <SiteFooter />
    </div>
  );
}
