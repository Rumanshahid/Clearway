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
      <SiteFooter />
      <LandingScripts />
    </div>
  );
}
