import Link from "next/link";
import "../landing.css";
import SiteNav from "../SiteNav";
import SiteFooter from "../SiteFooter";
import LandingScripts from "../LandingScripts";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { excerptFrom } from "@/lib/blog";

export const metadata = { title: "Search — asaanbil.com" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q || "").trim();

  const supabase = await createClient();
  const admin = await createAdminClient();

  const [{ data: posts }, { data: questions }, { data: doctorRows }] = query
    ? await Promise.all([
        supabase
          .from("blog_posts")
          .select("id, title, slug, excerpt, content, published_at")
          .eq("status", "published")
          .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
          .order("published_at", { ascending: false })
          .limit(10),
        supabase
          .from("questions")
          .select("id, title, body, created_at")
          .or(`title.ilike.%${query}%,body.ilike.%${query}%`)
          .order("created_at", { ascending: false })
          .limit(10),
        admin
          .from("doctor_profiles")
          .select("id, slug, profile_id, specialty, city, state")
          .eq("public_enabled", true)
          .ilike("specialty", `%${query}%`)
          .limit(10),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const doctorProfileIds = (doctorRows || []).map((d) => d.profile_id);
  const { data: doctorNames } = doctorProfileIds.length
    ? await admin.from("profiles").select("id, full_name").in("id", doctorProfileIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const nameById = new Map((doctorNames || []).map((p) => [p.id, p.full_name || "Doctor"]));

  const resultCount = (posts?.length || 0) + (questions?.length || 0) + (doctorRows?.length || 0);

  return (
    <div className="landing-root">
      <SiteNav />
      <div className="max-w-[860px] mx-auto px-5 sm:px-10 py-14">
        <h1 className="text-[26px] font-semibold mb-1">Search</h1>
        <form action="/search" method="GET" className="flex gap-2 mb-8 mt-4">
          <input className="input" type="search" name="q" defaultValue={query} placeholder="Search blog posts, questions, doctors…" autoFocus />
          <button type="submit" className="btn btn-primary flex-shrink-0">Search</button>
        </form>

        {!query && <p className="text-gray-400 text-center py-16">Enter a search term above.</p>}

        {query && resultCount === 0 && (
          <p className="text-gray-400 text-center py-16">No results for &quot;{query}&quot;.</p>
        )}

        {query && (posts?.length ?? 0) > 0 && (
          <section className="mb-10">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-gray-400 mb-4">Blog posts</h2>
            <div className="flex flex-col gap-4">
              {(posts || []).map((p) => (
                <Link key={p.id} href={`/blog/${p.slug}`} className="card p-4 hover:bg-gray-50 transition-colors">
                  <div className="text-[15px] font-semibold mb-1">{p.title}</div>
                  <p className="text-[13px] text-gray-600 leading-relaxed">{p.excerpt || excerptFrom(p.content, 140)}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {query && (questions?.length ?? 0) > 0 && (
          <section className="mb-10">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-gray-400 mb-4">Questions &amp; Answers</h2>
            <div className="flex flex-col gap-4">
              {(questions || []).map((qu) => (
                <Link key={qu.id} href={`/questions/${qu.id}`} className="card p-4 hover:bg-gray-50 transition-colors">
                  <div className="text-[15px] font-semibold mb-1">{qu.title}</div>
                  {qu.body && <p className="text-[13px] text-gray-600 leading-relaxed">{excerptFrom(qu.body, 140)}</p>}
                </Link>
              ))}
            </div>
          </section>
        )}

        {query && (doctorRows?.length ?? 0) > 0 && (
          <section>
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-gray-400 mb-4">Doctors</h2>
            <div className="flex flex-col gap-4">
              {(doctorRows || []).map((d) => (
                <Link key={d.id} href={`/doctor/${d.slug}`} className="card p-4 hover:bg-gray-50 transition-colors">
                  <div className="text-[15px] font-semibold mb-1">{nameById.get(d.profile_id)}</div>
                  <p className="text-[13px] text-gray-600">{d.specialty}{d.city ? ` · ${d.city}, ${d.state}` : ""}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
      <SiteFooter />
      <LandingScripts />
    </div>
  );
}
