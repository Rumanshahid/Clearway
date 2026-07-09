import Link from "next/link";
import "../landing.css";
import SiteNav from "../SiteNav";
import SiteFooter from "../SiteFooter";
import LandingScripts from "../LandingScripts";
import { createAdminClient } from "@/lib/supabase/server";
import { getOpenSlots } from "@/lib/scheduling";

export const metadata = {
  title: "Find a Doctor — asaanbil.com",
  description: "Search doctors and book an appointment directly.",
};

const INSURANCE_OPTIONS = ["Aetna", "Cigna / eviCore", "UnitedHealthcare", "Humana", "BCBS / Anthem", "Medicare", "Medicaid"];
const LANGUAGE_OPTIONS = ["English", "Spanish", "Mandarin", "Vietnamese", "Arabic", "Tagalog", "French", "Urdu/Hindi"];

export default async function DoctorsDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; specialty?: string; insurance?: string; language?: string; city?: string; new_patients?: string; telehealth?: string }>;
}) {
  const { q, specialty, insurance, language, city, new_patients, telehealth } = await searchParams;
  // Admin client: anonymous visitors have no session, and the profiles
  // table (queried below for names) has no public-select policy the way
  // doctor_profiles does, so the RLS-scoped client silently returned
  // nothing for it.
  const supabase = await createAdminClient();

  let query = supabase.from("doctor_profiles").select("*").eq("public_enabled", true);
  if (specialty) query = query.ilike("specialty", `%${specialty}%`);
  if (insurance) query = query.contains("insurance_accepted", [insurance]);
  if (language) query = query.contains("languages", [language]);
  if (city) query = query.ilike("city", `%${city}%`);
  if (new_patients === "1") query = query.eq("accepting_new_patients", true);
  if (telehealth === "1") query = query.eq("telehealth_available", true);

  const { data: doctorRows } = await query;
  let doctors = doctorRows || [];

  if (q) {
    const { data: matchingProfiles } = await supabase.from("profiles").select("id").ilike("full_name", `%${q}%`);
    const matchingIds = new Set((matchingProfiles || []).map((p) => p.id));
    doctors = doctors.filter((d) => matchingIds.has(d.profile_id) || (d.specialty || "").toLowerCase().includes(q.toLowerCase()));
  }

  const { data: profileRows } = doctors.length
    ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", doctors.map((d) => d.profile_id))
    : { data: [] as { id: string; full_name: string | null; avatar_url: string | null }[] };
  const nameById = new Map((profileRows || []).map((p) => [p.id, p.full_name || "Doctor"]));
  const avatarById = new Map((profileRows || []).map((p) => [p.id, p.avatar_url]));

  const searchWindowStart = new Date();
  const searchWindowEnd = new Date(searchWindowStart.getTime() + 14 * 24 * 60 * 60 * 1000);

  const nextSlots = await Promise.all(
    doctors.map(async (d) => {
      const { data: firstType } = await supabase
        .from("appointment_types")
        .select("id")
        .eq("doctor_profile_id", d.id)
        .eq("active", true)
        .order("sort_order")
        .limit(1)
        .maybeSingle();
      if (!firstType) return null;
      const slots = await getOpenSlots(supabase, d.id, firstType.id, searchWindowStart, searchWindowEnd);
      return slots[0] || null;
    })
  );

  return (
    <div className="landing-root">
      <SiteNav />

      <div className="wrap" style={{ padding: "48px 40px 80px" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Find a doctor</h1>
        <p style={{ fontSize: 14.5, color: "var(--gray-600)", marginBottom: 32 }}>
          Search Asaanbil&apos;s network of practices and book directly — no phone tag.
        </p>

        <form className="card p-5 mb-8 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="q">Name or specialty</label>
            <input className="input" id="q" name="q" placeholder="Dr. Okonkwo, orthopedics..." defaultValue={q || ""} />
          </div>
          <div>
            <label className="label" htmlFor="city">City</label>
            <input className="input" id="city" name="city" placeholder="Austin" defaultValue={city || ""} />
          </div>
          <div>
            <label className="label" htmlFor="insurance">Insurance</label>
            <select className="input" id="insurance" name="insurance" defaultValue={insurance || ""}>
              <option value="">Any</option>
              {INSURANCE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="language">Language</label>
            <select className="input" id="language" name="language" defaultValue={language || ""}>
              <option value="">Any</option>
              {LANGUAGE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-[13.5px]">
            <input type="checkbox" name="new_patients" value="1" defaultChecked={new_patients === "1"} className="w-4 h-4" />
            Accepting new patients
          </label>
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-[13.5px]">
              <input type="checkbox" name="telehealth" value="1" defaultChecked={telehealth === "1"} className="w-4 h-4" />
              Telehealth available
            </label>
            <button type="submit" className="btn btn-primary btn-sm">Search</button>
          </div>
        </form>

        <div className="flex flex-col gap-4">
          {doctors.length === 0 && (
            <p style={{ color: "var(--gray-400)", fontSize: 14 }}>No doctors match those filters yet.</p>
          )}
          {doctors.map((d, i) => (
            <Link
              key={d.id}
              href={`/doctors/${d.slug}`}
              className="card p-5 flex items-center gap-4 hover:shadow-sm"
              style={{ textDecoration: "none" }}
            >
              <div
                className="rounded-full flex-shrink-0"
                style={{ width: 56, height: 56, background: "var(--gray-100)", backgroundImage: avatarById.get(d.profile_id) ? `url(${avatarById.get(d.profile_id)})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}
              />
              <div className="flex-1">
                <div style={{ fontSize: 15.5, fontWeight: 600, color: "var(--gray-900)" }}>
                  {nameById.get(d.profile_id)}{d.credentials ? `, ${d.credentials}` : ""}
                </div>
                <div style={{ fontSize: 13, color: "var(--gray-600)" }}>{d.specialty}</div>
                <div style={{ fontSize: 12.5, color: "var(--gray-400)" }}>
                  {[d.city, d.state].filter(Boolean).join(", ")}
                  {d.insurance_accepted.length > 0 && ` · Accepts ${d.insurance_accepted.slice(0, 2).join(", ")}${d.insurance_accepted.length > 2 ? "..." : ""}`}
                </div>
              </div>
              <div style={{ textAlign: "right", fontSize: 12.5, flexShrink: 0 }}>
                {nextSlots[i] ? (
                  <span style={{ color: "var(--success-green)" }}>
                    Next: {new Date(nextSlots[i]!.start).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                ) : (
                  <span style={{ color: "var(--gray-400)" }}>No slots open</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <SiteFooter />
      <LandingScripts />
    </div>
  );
}
