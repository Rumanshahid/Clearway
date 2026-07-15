import Link from "next/link";
import "../landing.css";
import SiteNav from "../SiteNav";
import SiteFooter from "../SiteFooter";
import LandingScripts from "../LandingScripts";
import { createClient } from "@/lib/supabase/server";
import { excerptFrom } from "@/lib/blog";

export const metadata = {
  title: "Blog — asaanbil.com",
  description: "Notes on prior authorization, claims, and running a specialty practice.",
};

export default async function BlogListPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, content, cover_image_url, tags, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (tag) query = query.contains("tags", [tag]);

  const { data: posts } = await query;

  const { data: allTagRows } = await supabase.from("blog_posts").select("tags").eq("status", "published");
  const allTags = Array.from(new Set((allTagRows || []).flatMap((r) => r.tags))).sort();

  return (
    <div className="landing-root">
      <SiteNav />
      <div className="max-w-[860px] mx-auto px-5 py-14">
        <h1 className="text-[32px] font-semibold mb-2">Blog</h1>
        <p className="text-[15px] text-gray-600 mb-8">Notes on prior authorization, claims, and running a specialty practice.</p>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <Link
              href="/blog"
              className="status-pill"
              style={!tag ? { background: "var(--indigo-600)", color: "#fff" } : { background: "var(--gray-100)", color: "var(--gray-600)" }}
            >
              All
            </Link>
            {allTags.map((t) => (
              <Link
                key={t}
                href={`/blog?tag=${encodeURIComponent(t)}`}
                className="status-pill"
                style={tag === t ? { background: "var(--indigo-600)", color: "#fff" } : { background: "var(--gray-100)", color: "var(--gray-600)" }}
              >
                {t}
              </Link>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-8">
          {(posts || []).map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="flex flex-col sm:flex-row gap-5 group">
              {post.cover_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.cover_image_url} alt="" className="w-full sm:w-[220px] h-[140px] object-cover rounded-lg flex-shrink-0" />
              )}
              <div className="min-w-0">
                <div className="text-[12px] text-gray-400 mb-1">
                  {post.published_at && new Date(post.published_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
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
      </div>
      <SiteFooter />
      <LandingScripts />
    </div>
  );
}
