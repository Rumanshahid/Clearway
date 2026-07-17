import Link from "next/link";
import "../landing.css";
import SiteNav from "../SiteNav";
import SiteFooter from "../SiteFooter";
import LandingScripts from "../LandingScripts";
import { createClient } from "@/lib/supabase/server";
import { excerptFrom } from "@/lib/blog";
import FiltersSidebar from "./FiltersSidebar";
import SuggestionsSidebar from "./SuggestionsSidebar";
import SiteSearchBar from "../SiteSearchBar";

export const metadata = {
  title: "Blog — asaanbil.com",
  description: "Notes on prior authorization, claims, and running a specialty practice — from our team, physicians, and patients.",
};

export default async function BlogListPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; author_type?: string; sort?: string }>;
}) {
  const { tag, author_type: authorType, sort } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Patients can read/like/upvote/comment but not author posts -- only
  // staff (and the super_admin/company voice) write blog content.
  let canWrite = false;
  if (user) {
    const { data: patientAccount } = await supabase.from("patient_accounts").select("id").eq("id", user.id).maybeSingle();
    canWrite = !patientAccount;
  }

  let query = supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, content, cover_image_url, tags, author_type, upvote_count, published_at")
    .eq("status", "published");
  if (tag) query = query.contains("tags", [tag]);
  if (authorType === "staff" || authorType === "patient") query = query.eq("author_type", authorType);
  query = sort === "top" ? query.order("upvote_count", { ascending: false }) : query.order("published_at", { ascending: false });

  const { data: posts } = await query;

  const { data: allTagRows } = await supabase.from("blog_posts").select("tags").eq("status", "published");
  const allTags = Array.from(new Set((allTagRows || []).flatMap((r) => r.tags))).sort();

  const { data: suggested } = await supabase
    .from("blog_posts")
    .select("slug, title")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(5);

  return (
    <div className="landing-root">
      <SiteNav />
      <div className="wrap" style={{ width: "100%", paddingTop: 56, paddingBottom: 56 }}>
        <div className="mb-8">
          <SiteSearchBar placeholder="Search blog posts…" />
        </div>

        <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
          <div>
            <h1 className="text-[32px] font-semibold mb-2">Blog</h1>
            <p className="text-[15px] text-gray-600">Notes on prior authorization, claims, and running a specialty practice — from our team, physicians, and patients.</p>
          </div>
          {canWrite && (
            <Link href="/blog/new" className="btn btn-primary flex-shrink-0">Write a post →</Link>
          )}
        </div>

        <div className="flex gap-6 items-start mt-8">
          <FiltersSidebar tag={tag} authorType={authorType} sort={sort} tagOptions={allTags} />

          <div className="flex-1 min-w-0 flex flex-col gap-8">
            {(posts || []).map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="flex flex-col sm:flex-row gap-5 group">
                {post.cover_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.cover_image_url} alt="" className="w-full sm:w-[220px] h-[140px] object-cover rounded-lg flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[12px] text-gray-400 mb-1">
                    {post.published_at && <span>{new Date(post.published_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</span>}
                    <span>·</span>
                    <span>{post.author_type === "patient" ? "Patient" : "Doctor/Staff"}</span>
                    <span>·</span>
                    <span>▲ {post.upvote_count}</span>
                  </div>
                  <h2 className="text-[19px] font-semibold mb-1.5 group-hover:text-indigo-600 transition-colors">{post.title}</h2>
                  <p className="text-[14px] text-gray-600 leading-relaxed">{post.excerpt || excerptFrom(post.content)}</p>
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {post.tags.map((t) => (
                        <span key={t} className="text-[11.5px] text-gray-400">#{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
            {(!posts || posts.length === 0) && (
              <p className="text-gray-400 text-center py-16">
                {tag ? `No posts tagged "${tag}" yet.` : "No posts yet — check back soon."}
              </p>
            )}
          </div>

          <SuggestionsSidebar posts={suggested || []} />
        </div>
      </div>
      <SiteFooter />
      <LandingScripts />
    </div>
  );
}
