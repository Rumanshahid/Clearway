import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import "../../landing.css";
import SiteNav from "../../SiteNav";
import SiteFooter from "../../SiteFooter";
import LandingScripts from "../../LandingScripts";
import { createClient } from "@/lib/supabase/server";
import { renderMarkdown, excerptFrom } from "@/lib/blog";
import { getPublicIdentities } from "@/lib/blog-identity";
import { toggleFollowAction } from "../../social-actions";
import {
  toggleLikeAction,
  toggleUpvoteAction,
  deleteOwnBlogPostAction,
  addCommentAction,
  editCommentAction,
  deleteCommentAction,
} from "../actions";

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

export default async function BlogPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;
  const post = await getPost(slug);
  if (!post) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: likes }, { data: comments }, suggested] = await Promise.all([
    user ? supabase.from("profiles").select("role").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("blog_likes").select("user_id").eq("post_id", post.id),
    supabase.from("blog_comments").select("*").eq("post_id", post.id).order("created_at", { ascending: true }),
    getSuggestedPosts(post.id, post.tags),
  ]);

  const isSuperAdmin = profile?.role === "super_admin";
  const isOwner = (post.author_id && post.author_id === user?.id) || (post.patient_author_id && post.patient_author_id === user?.id);
  const isLiked = !!user && (likes || []).some((l) => l.user_id === user.id);

  const identities = await getPublicIdentities([
    ...(post.author_id ? [post.author_id] : []),
    ...(post.patient_author_id ? [post.patient_author_id] : []),
    ...(comments || []).map((c) => c.user_id),
  ]);
  const authorIdentity = identities[post.author_id || post.patient_author_id || ""];
  const authorUserId = post.author_id || post.patient_author_id;
  const isFollowingAuthor =
    !!user && !!authorUserId
      ? !!(await supabase.from("user_follows").select("follower_id").eq("follower_id", user.id).eq("followed_id", authorUserId).maybeSingle()).data
      : false;

  return (
    <div className="landing-root">
      <SiteNav />
      <article className="max-w-[720px] mx-auto px-5 sm:px-10 py-14">
        <Link href="/blog" className="text-[13px] text-indigo-600 font-medium">← Back to Blog</Link>

        <h1 className="text-[32px] font-semibold mt-4 mb-3">{post.title}</h1>
        <div className="flex items-center gap-3 text-[13px] text-gray-400 mb-6 flex-wrap">
          {authorIdentity && <span className="text-gray-600 font-medium">{authorIdentity.displayName}</span>}
          {user && authorUserId && authorUserId !== user.id && (
            <form action={toggleFollowAction}>
              <input type="hidden" name="target_user_id" value={authorUserId} />
              <input type="hidden" name="redirect_to" value={`/blog/${post.slug}`} />
              <button type="submit" className="text-[12.5px] font-medium" style={{ color: "var(--indigo-600)" }}>
                {isFollowingAuthor ? "Following" : "+ Follow"}
              </button>
            </form>
          )}
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
          {(isOwner || isSuperAdmin) && (
            <div className="flex items-center gap-3 ml-auto">
              <Link href={`/blog/${post.slug}/edit`} className="text-indigo-600 font-medium">Edit</Link>
              <form action={deleteOwnBlogPostAction}>
                <input type="hidden" name="post_id" value={post.id} />
                <button type="submit" className="text-btn text-[13px]" style={{ color: "var(--danger-red)" }}>Delete</button>
              </form>
            </div>
          )}
        </div>

        {post.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.cover_image_url} alt="" className="w-full max-h-[420px] object-cover rounded-xl mb-8" />
        )}

        <div className="blog-preview" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }} />

        <div className="flex items-center gap-3 mt-10 pt-6" style={{ borderTop: "1px solid var(--gray-200)" }}>
          <form action={toggleLikeAction}>
            <input type="hidden" name="post_id" value={post.id} />
            <input type="hidden" name="slug" value={post.slug} />
            <button
              type="submit"
              className="btn"
              style={isLiked ? { background: "var(--indigo-600)", color: "#fff" } : undefined}
            >
              {isLiked ? "♥ Liked" : "♡ Like"} ({(likes || []).length})
            </button>
          </form>
          <form action={toggleUpvoteAction}>
            <input type="hidden" name="post_id" value={post.id} />
            <input type="hidden" name="slug" value={post.slug} />
            <button type="submit" className="btn">▲ Upvote ({post.upvote_count})</button>
          </form>
        </div>

        <section className="mt-10">
          <h2 className="text-[16px] font-semibold mb-4">Comments ({(comments || []).length})</h2>

          {error && (
            <div className="mb-4 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
              {error}
            </div>
          )}

          {user ? (
            <form action={addCommentAction} className="flex flex-col gap-2 mb-6">
              <input type="hidden" name="post_id" value={post.id} />
              <input type="hidden" name="slug" value={post.slug} />
              <textarea className="input" name="content" rows={3} placeholder="Add a comment…" required />
              <button type="submit" className="btn btn-primary self-start">Comment</button>
            </form>
          ) : (
            <p className="text-[13.5px] text-gray-500 mb-6">
              <Link href={`/sign-in?next=${encodeURIComponent(`/blog/${post.slug}`)}`} className="text-indigo-600 font-medium">Sign in</Link> to like or comment.
            </p>
          )}

          <div className="flex flex-col gap-5">
            {(comments || []).map((comment) => {
              const commenter = identities[comment.user_id];
              const canModify = comment.user_id === user?.id;
              return (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-[12px] font-semibold text-gray-600 flex-shrink-0 overflow-hidden">
                    {commenter?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={commenter.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (commenter?.displayName || "?").charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-[13px]">
                      <span className="font-semibold text-gray-900">{commenter?.displayName || "Unknown"}</span>
                      <span className="text-gray-400">{new Date(comment.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[14px] text-gray-700 whitespace-pre-wrap mt-0.5">{comment.content}</p>
                    {(canModify || isSuperAdmin) && (
                      <div className="flex items-center gap-3 mt-1">
                        {canModify && (
                          <details className="inline-block">
                            <summary className="text-[12.5px] text-indigo-600 font-medium cursor-pointer list-none">Edit</summary>
                            <form action={editCommentAction} className="flex flex-col gap-2 mt-2">
                              <input type="hidden" name="comment_id" value={comment.id} />
                              <input type="hidden" name="slug" value={post.slug} />
                              <textarea className="input" name="content" rows={2} defaultValue={comment.content} required />
                              <button type="submit" className="btn btn-primary self-start text-[12.5px]">Save</button>
                            </form>
                          </details>
                        )}
                        <form action={deleteCommentAction}>
                          <input type="hidden" name="comment_id" value={comment.id} />
                          <input type="hidden" name="slug" value={post.slug} />
                          <button type="submit" className="text-btn text-[12.5px]" style={{ color: "var(--danger-red)" }}>Delete</button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {(comments || []).length === 0 && <p className="text-gray-400 text-[13.5px]">No comments yet.</p>}
          </div>
        </section>
      </article>

      {suggested.length > 0 && (
        <section className="max-w-[860px] mx-auto px-5 sm:px-10 pb-14">
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
