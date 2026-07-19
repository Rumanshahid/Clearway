import Link from "next/link";
import { notFound } from "next/navigation";
import "../../landing.css";
import SiteNav from "../../SiteNav";
import SiteFooter from "../../SiteFooter";
import LandingScripts from "../../LandingScripts";
import DashboardNavBar from "@/app/dashboard/DashboardNavBar";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getDashboardNavData } from "@/lib/dashboardNav";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createAdminClient();
  const { data: doctor } = await supabase.from("doctor_profiles").select("specialty, profile_id").eq("slug", slug).eq("public_enabled", true).maybeSingle();
  if (!doctor) return { title: "Doctor — asaanbil.com" };
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", doctor.profile_id).single();
  return {
    title: `${profile?.full_name || "Doctor"} — asaanbil.com`,
    description: doctor.specialty || undefined,
  };
}

// Extracted so /patient/doctor/[slug] can render the same profile under
// its own URL prefix, without the marketing chrome -- PatientLayout
// already supplies its own nav there.
export async function DoctorProfileContent({
  slug,
  saved,
  basePath = "/doctor",
  showChrome = true,
}: {
  slug: string;
  saved?: string;
  basePath?: string;
  showChrome?: boolean;
}) {
  // Admin client: anonymous visitors have no session, and profiles has no
  // public-select policy the way doctor_profiles/reviews do.
  const supabase = await createAdminClient();

  // Fetched without the public_enabled filter so the owner can preview their
  // own page before publishing -- visibility for everyone else is enforced
  // just below instead.
  const { data: doctor } = await supabase.from("doctor_profiles").select("*").eq("slug", slug).maybeSingle();

  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  const isOwner = !!user && !!doctor && user.id === doctor.profile_id;

  if (!doctor || (!doctor.public_enabled && !isOwner)) notFound();

  // Signed in and looking at your own page should feel like still being in
  // the dashboard -- the full internal nav (section links, chat/tasks/
  // notifications, account menu) replaces the marketing SiteNav here,
  // rather than just linking out to it. Never applies under /patient/ --
  // a patient is never a doctor -- so showChrome=false always wins there.
  const navData = isOwner && showChrome ? await getDashboardNavData(user!.id) : null;

  const [{ data: profile }, { data: reviews }] = await Promise.all([
    supabase.from("profiles").select("full_name, avatar_url").eq("id", doctor.profile_id).single(),
    supabase
      .from("reviews")
      .select("rating, comment, patient_display_name, created_at")
      .eq("doctor_profile_id", doctor.id)
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const avgRating = reviews && reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;

  const content = (
    <div className="wrap" style={{ padding: "48px 40px 80px", maxWidth: 900 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href={basePath} style={{ fontSize: 13, color: "var(--gray-400)" }}>← Back to directory</Link>
        {isOwner && showChrome && (
          <Link href="/dashboard/profiles" className="btn btn-primary btn-sm">Edit Profile</Link>
        )}
      </div>

      {isOwner && showChrome && saved && (
        <div className="mt-4 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--success-bg)", color: "var(--success-green)" }}>
          Profile saved.
        </div>
      )}

      <div style={{ display: "flex", gap: 24, marginTop: 20, marginBottom: 32, flexWrap: "wrap" }}>
        <div
          className="rounded-full flex-shrink-0"
          style={{ width: 96, height: 96, background: "var(--gray-100)", backgroundImage: profile?.avatar_url ? `url(${profile.avatar_url})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div style={{ flex: 1, minWidth: 240 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700 }}>
            {profile?.full_name}{doctor.credentials ? `, ${doctor.credentials}` : ""}
          </h1>
          <p style={{ fontSize: 15, color: "var(--gray-600)", marginTop: 4 }}>{doctor.specialty}</p>
          {doctor.sub_specialties.length > 0 && (
            <p style={{ fontSize: 13, color: "var(--gray-400)", marginTop: 2 }}>{doctor.sub_specialties.join(" · ")}</p>
          )}
          {avgRating !== null && (
            <p style={{ fontSize: 13, color: "var(--gray-600)", marginTop: 6 }}>
              ★ {avgRating.toFixed(1)} ({reviews!.length} review{reviews!.length === 1 ? "" : "s"})
            </p>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {doctor.accepting_new_patients && <span className="status-pill" style={{ background: "var(--success-bg)", color: "var(--success-green)" }}>Accepting new patients</span>}
            {doctor.telehealth_available && <span className="status-pill" style={{ background: "#EEF0FF", color: "var(--indigo-600)" }}>Telehealth available</span>}
          </div>
        </div>
        {!isOwner && (
          <div style={{ flexShrink: 0, alignSelf: "center" }}>
            <Link href={`${basePath}/${doctor.slug}/book`} className="btn btn-primary" style={{ fontSize: 15, padding: "14px 28px" }}>
              Book Appointment →
            </Link>
          </div>
        )}
      </div>

      {doctor.bio && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10 }}>About</h2>
          <p style={{ fontSize: 14.5, color: "var(--gray-600)", lineHeight: 1.7 }}>{doctor.bio}</p>
        </section>
      )}

      {doctor.conditions_treated.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10 }}>Conditions treated</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {doctor.conditions_treated.map((c) => (
              <span key={c} className="status-pill" style={{ background: "var(--gray-100)", color: "var(--gray-600)" }}>{c}</span>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8" style={{ marginBottom: 32 }}>
        {doctor.insurance_accepted.length > 0 && (
          <section>
            <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10 }}>Insurance accepted</h2>
            <ul style={{ fontSize: 14, color: "var(--gray-600)", lineHeight: 1.9 }}>
              {doctor.insurance_accepted.map((ins) => <li key={ins}>{ins}</li>)}
            </ul>
          </section>
        )}
        {doctor.languages.length > 0 && (
          <section>
            <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10 }}>Languages spoken</h2>
            <ul style={{ fontSize: 14, color: "var(--gray-600)", lineHeight: 1.9 }}>
              {doctor.languages.map((l) => <li key={l}>{l}</li>)}
            </ul>
          </section>
        )}
      </div>

      {(doctor.address_line1 || doctor.city) && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10 }}>Location</h2>
          <p style={{ fontSize: 14.5, color: "var(--gray-600)" }}>
            {doctor.address_line1}{doctor.address_line1 && <br />}
            {[doctor.city, doctor.state, doctor.zip].filter(Boolean).join(", ")}
          </p>
        </section>
      )}

      {reviews && reviews.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 14 }}>Patient reviews</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {reviews.map((r, i) => (
              <div key={i} className="card" style={{ padding: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                {r.comment && <p style={{ fontSize: 13.5, color: "var(--gray-600)", marginBottom: 6 }}>{r.comment}</p>}
                <div style={{ fontSize: 12, color: "var(--gray-400)" }}>{r.patient_display_name || "Patient"}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!isOwner && (
        <div style={{ textAlign: "center", paddingTop: 8 }}>
          <Link href={`${basePath}/${doctor.slug}/book`} className="btn btn-primary" style={{ fontSize: 15, padding: "14px 28px" }}>
            Book Appointment →
          </Link>
        </div>
      )}
    </div>
  );

  if (!showChrome) return content;

  return (
    <div className="landing-root">
      {navData ? <DashboardNavBar data={navData} /> : <SiteNav />}
      {content}
      <SiteFooter />
      <LandingScripts />
    </div>
  );
}

export default async function DoctorProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { slug } = await params;
  const { saved } = await searchParams;
  return <DoctorProfileContent slug={slug} saved={saved} />;
}
