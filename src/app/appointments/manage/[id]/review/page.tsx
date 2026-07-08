import { notFound } from "next/navigation";
import "../../../../landing.css";
import SiteNav from "../../../../SiteNav";
import SiteFooter from "../../../../SiteFooter";
import { createAdminClient } from "@/lib/supabase/server";
import { submitReviewAction } from "./actions";

export const metadata = { title: "Leave a Review — asaanbil.com" };

export default async function LeaveReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { id } = await params;
  const { submitted } = await searchParams;
  const supabase = await createAdminClient();

  const { data: appointment } = await supabase.from("appointments").select("id, patient_full_name").eq("id", id).maybeSingle();
  if (!appointment) notFound();

  const { data: existingReview } = await supabase.from("reviews").select("id").eq("appointment_id", id).maybeSingle();
  const firstName = appointment.patient_full_name.split(" ")[0];
  const lastInitial = appointment.patient_full_name.split(" ").slice(-1)[0]?.[0] || "";

  return (
    <div className="landing-root">
      <SiteNav />
      <div className="wrap" style={{ padding: "48px 40px 80px", maxWidth: 480 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>How was your visit?</h1>

        {submitted || existingReview ? (
          <p style={{ fontSize: 14.5, color: "var(--gray-600)" }}>Thanks for sharing your feedback!</p>
        ) : (
          <form action={submitReviewAction} className="card p-6 flex flex-col gap-4">
            <input type="hidden" name="appointment_id" value={id} />
            <input type="hidden" name="patient_display_name" value={`${firstName} ${lastInitial}.`} />
            <div>
              <label className="label">Rating</label>
              <select className="input" name="rating" required defaultValue="">
                <option value="" disabled>Select a rating</option>
                <option value="5">★★★★★ Excellent</option>
                <option value="4">★★★★ Good</option>
                <option value="3">★★★ Okay</option>
                <option value="2">★★ Not great</option>
                <option value="1">★ Poor</option>
              </select>
            </div>
            <div>
              <label className="label">Comments (optional)</label>
              <textarea className="input" name="comment" rows={4} />
            </div>
            <button type="submit" className="btn btn-primary self-start">Submit review</button>
          </form>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
