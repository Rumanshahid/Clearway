import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import "../../landing.css";
import SiteNav from "../../SiteNav";
import SiteFooter from "../../SiteFooter";
import LandingScripts from "../../LandingScripts";
import { createClient } from "@/lib/supabase/server";
import { renderMarkdown, excerptFrom } from "@/lib/blog";

async function getPost(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("blog_posts").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
  return data;
}

interface SuggestedPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  published_at: string | null;
}

// No view-count tracking exists yet, so "popular" isn't something we can
// measure honestly -- this ranks by tag overlap with the current post first
// (genuinely related reading), falling back to most recent, which is a
// reasonable stand-in until real view data exists to rank by instead.
async function getSuggestedPosts(currentId: string, tags: string[]): Promise<SuggestedPost[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, content, cover_image_url, tags, published_at")
    .eq("status", "published")
    .neq("id", currentId)
    .order("published_at", { ascending: false })
    .limit(20);

  return (data || [])
    .map((p) => ({ ...p, overlap: p.tags.filter((t) => tags.includes(t)).length }))
    .sort((a, b) => b.overlap - a.overlap || (b.published_at || "").localeCompare(a.published_at || ""))
    .slice(0, 3);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post not found — asaanbil.com" };

  const title = post.seo_title || `${post.title} — asaanbil.com Blog`;
  const description = post.seo_description || post.excerpt || excerptFrom(post.content);
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: post.cover_image_url ? [post.cover_image_url] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const suggested = await getSuggestedPosts(post.id, post.tags);

  return (
    <div className="landing-root">
      <SiteNav />
      <article className="max-w-[720px] mx-auto px-5 py-14">
        <Link href="/blog" className="text-[13px] text-indigo-600 font-medium">← Back to Blog</Link>

        <h1 className="text-[32px] font-semibold mt-4 mb-3">{post.title}</h1>
        <div className="flex items-center gap-3 text-[13px] text-gray-400 mb-6">
          {post.published_at && (
            <span>{new Date(post.published_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</span>
          )}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((t) => (
                <Link key={t} href={`/blog?tag=${encodeURIComponent(t)}`} className="hover:text-indigo-600">#{t}</Link>
              ))}
            </div>
          )}
        </div>

        {post.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.cover_image_url} alt="" className="w-full max-h-[420px] object-cover rounded-xl mb-8" />
        )}

        <div className="blog-preview" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }} />
      </article>

      {suggested.length > 0 && (
        <section className="max-w-[860px] mx-auto px-5 pb-14">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-gray-400 mb-4">Keep reading</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {suggested.map((s) => (
              <Link key={s.id} href={`/blog/${s.slug}`} className="card p-4 flex flex-col gap-2 hover:bg-gray-50 transition-colors">
                {s.cover_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.cover_image_url} alt="" className="w-full h-[110px] object-cover rounded-lg" />
                )}
                <div className="text-[12px] text-gray-400">
                  {s.published_at && new Date(s.published_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                </div>
                <div className="text-[15px] font-semibold leading-snug">{s.title}</div>
                <p className="text-[13px] text-gray-600 leading-relaxed line-clamp-2">{s.excerpt || excerptFrom(s.content, 110)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <SiteFooter />
      <LandingScripts />
    </div>
  );
}
