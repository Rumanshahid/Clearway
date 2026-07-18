import { notFound } from "next/navigation";
import "../../../landing.css";
import SiteNav from "../../../SiteNav";
import SiteFooter from "../../../SiteFooter";
import { createAdminClient } from "@/lib/supabase/server";
import BookingClient from "./BookingClient";

export const metadata = {
  title: "Book an Appointment — asaanbil.com",
};

// Extracted so /patient/doctors/[slug]/book can render the same booking
// flow under its own URL prefix, without the marketing chrome --
// PatientLayout already supplies its own nav there.
export async function BookAppointmentContent({
  slug,
  basePath = "/doctors",
  showChrome = true,
}: {
  slug: string;
  basePath?: string;
  showChrome?: boolean;
}) {
  // Admin client, not the RLS-scoped one: an anonymous visitor has no
  // session, and the profiles table (unlike doctor_profiles/intake_questions)
  // has no public-select policy, so the regular client silently returned
  // null for full_name here and fell back to "the doctor".
  const supabase = await createAdminClient();

  const { data: doctor } = await supabase.from("doctor_profiles").select("id, slug, telehealth_available").eq("slug", slug).eq("public_enabled", true).maybeSingle();
  if (!doctor) notFound();

  const { data: profileRow } = await supabase
    .from("doctor_profiles")
    .select("profile_id, credentials")
    .eq("id", doctor.id)
    .single();
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", profileRow!.profile_id).single();

  const content = (
    <div className="wrap" style={{ padding: "48px 40px 80px", maxWidth: 640 }}>
      <BookingClient
        doctorSlug={slug}
        doctorName={`${profile?.full_name || "the doctor"}${profileRow?.credentials ? `, ${profileRow.credentials}` : ""}`}
        telehealthAvailable={doctor.telehealth_available}
        backHref={basePath}
      />
    </div>
  );

  if (!showChrome) return content;

  return (
    <div className="landing-root">
      <SiteNav />
      {content}
      <SiteFooter />
    </div>
  );
}

export default async function BookAppointmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <BookAppointmentContent slug={slug} />;
}
