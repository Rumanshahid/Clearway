import { notFound } from "next/navigation";
import "../../../landing.css";
import SiteNav from "../../../SiteNav";
import SiteFooter from "../../../SiteFooter";
import { createClient } from "@/lib/supabase/server";
import BookingClient from "./BookingClient";

export const metadata = {
  title: "Book an Appointment — asaanbil.com",
};

export default async function BookAppointmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: doctor } = await supabase.from("doctor_profiles").select("id, slug").eq("slug", slug).eq("public_enabled", true).maybeSingle();
  if (!doctor) notFound();

  const { data: profileRow } = await supabase
    .from("doctor_profiles")
    .select("profile_id, credentials")
    .eq("id", doctor.id)
    .single();
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", profileRow!.profile_id).single();

  const { data: questions } = await supabase
    .from("intake_questions")
    .select("question_key, question_text")
    .eq("doctor_profile_id", doctor.id)
    .eq("active", true)
    .order("sort_order");

  return (
    <div className="landing-root">
      <SiteNav />
      <div className="wrap" style={{ padding: "48px 40px 80px", maxWidth: 640 }}>
        <BookingClient
          doctorSlug={slug}
          doctorName={`${profile?.full_name || "the doctor"}${profileRow?.credentials ? `, ${profileRow.credentials}` : ""}`}
          questions={(questions || []).map((q) => q.question_text)}
        />
      </div>
      <SiteFooter />
    </div>
  );
}
