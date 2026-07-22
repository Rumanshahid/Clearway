import Link from "next/link";
import "../landing.css";
import SiteNav from "../SiteNav";
import SiteFooter from "../SiteFooter";
import LandingScripts from "../LandingScripts";
import { createClient } from "@/lib/supabase/server";
import { getPublicIdentities } from "@/lib/blog-identity";
import FiltersSidebar from "./FiltersSidebar";
import SuggestionsSidebar from "./SuggestionsSidebar";
import SiteSearchBar from "../SiteSearchBar";
import PostCard from "./PostCard";

export const metadata = {
  title: "Blog — asaanbil.com",
  description: "Notes on prior authorization, claims, and running a specialty practice — from our team, physicians, and patients.",
};

// Extracted so /patient/blog and /doctor/blog can render the same feed
// under their own URL prefix, without the marketing chrome -- their
// layouts already supply their own nav.
export async function BlogListContent({
  searchParams,
  basePath = "/blog",
  showChrome = true,
  showHeading = true,
}: {
  searchParams: Promise<{ tag?: string; author_type?: string; sort?: string }>;
  basePath?: string;
  showChrome?: boolean;
  showHeading?: boolean;
}) {
  const { tag, author_type: authorType, sort } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Patients can read/like/upvote/comment but not author posts -- only
  // staff (and the super_admin/company voice) write blog content.
  let canWrite = false;
  let isSuperAdmin = false;
  if (user) {
    const [{ data: patientAccount }, { data: profile }] = await Promise.all([
      supabase.from("patient_accounts").select("id").eq("id", user.id).maybeSingle(),
      supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    ]);
    canWrite = !patientAccount;
    isSuperAdmin = profile?.role === "super_admin";
  }

  let query = supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, content, cover_image_url, tags, author_type, author_id, patient_author_id, upvote_count, published_at")
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

  // Batch-fetch likes/comments/identities/follow-status for every post on
  // this page in a handful of queries, rather than one round trip per card.
  const postIds = (posts || []).map((p) => p.id);
  const [{ data: allLikes }, { data: allComments }] = await Promise.all([
    postIds.length ? supabase.from("blog_likes").select("post_id, user_id").in("post_id", postIds) : Promise.resolve({ data: [] }),
    postIds.length
      ? supabase.from("blog_comments").select("id, post_id, user_id, content, created_at").in("post_id", postIds).order("created_at", { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);

  const likesByPost = new Map<string, { user_id: string }[]>();
  for (const like of allLikes || []) likesByPost.set(like.post_id, [...(likesByPost.get(like.post_id) || []), like]);

  const commentsByPost = new Map<string, NonNullable<typeof allComments>>();
  for (const comment of allComments || []) commentsByPost.set(comment.post_id, [...(commentsByPost.get(comment.post_id) || []), comment]);

  const authorIds = (posts || []).map((p) => p.author_id || p.patient_author_id).filter((id): id is string => !!id);
  const commenterIds = (allComments || []).map((c) => c.user_id);
  const identities = await getPublicIdentities([...authorIds, ...commenterIds]);

  let followingSet = new Set<string>();
  if (user && authorIds.length) {
    const { data: followRows } = await supabase.from("user_follows").select("followed_id").eq("follower_id", user.id).in("followed_id", authorIds);
    followingSet = new Set((followRows || []).map((r) => r.followed_id));
  }

  const content = (
    <div className="wrap" style={{ width: "100%", paddingTop: 24, paddingBottom: 56 }}>
      <div className="mb-8">
        <SiteSearchBar placeholder="Search blog posts…" />
      </div>

      {showHeading && (
        <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
          <div>
            <h1 className="text-[32px] font-semibold mb-2">Blog</h1>
            <p className="text-[15px] text-gray-600">Notes on prior authorization, claims, and running a specialty practice — from our team, physicians, and patients.</p>
          </div>
          {canWrite && (
            <Link href={`${basePath}/new`} className="btn btn-primary flex-shrink-0">Write a post →</Link>
          )}
        </div>
      )}

      <div className={`flex gap-6 items-start ${showHeading ? "mt-8" : ""}`}>
        <FiltersSidebar tag={tag} authorType={authorType} sort={sort} tagOptions={allTags} basePath={basePath} />

        <div className="flex-1 min-w-0 flex flex-col gap-5">
          {(posts || []).map((post) => {
            const authorUserId = post.author_id || post.patient_author_id;
            const postLikes = likesByPost.get(post.id) || [];
            const postComments = commentsByPost.get(post.id) || [];
            return (
              <PostCard
                key={post.id}
                post={post}
                basePath={basePath}
                currentUserId={user?.id || null}
                isSuperAdmin={isSuperAdmin}
                authorIdentity={authorUserId ? identities[authorUserId] : undefined}
                authorUserId={authorUserId}
                isFollowingAuthor={!!authorUserId && followingSet.has(authorUserId)}
                likeCount={postLikes.length}
                isLiked={!!user && postLikes.some((l) => l.user_id === user.id)}
                comments={postComments}
                commenterIdentities={identities}
              />
            );
          })}
          {(!posts || posts.length === 0) && (
            <p className="text-gray-400 text-center py-16">
              {tag ? `No posts tagged "${tag}" yet.` : "No posts yet — check back soon."}
            </p>
          )}
        </div>

        {showHeading ? (
          <SuggestionsSidebar posts={suggested || []} basePath={basePath} />
        ) : (
          <div className="flex flex-col gap-4 items-end">
            {canWrite && (
              <Link href={`${basePath}/new`} className="btn btn-primary flex-shrink-0">Write a post →</Link>
            )}
            <SuggestionsSidebar posts={suggested || []} basePath={basePath} />
          </div>
        )}
      </div>
    </div>
  );

  if (!showChrome) return content;

  return (
    <div className="landing-root">
      <SiteNav />
      {content}
      <SiteFooter />
      <LandingScripts />
    </div>
  );
}

export default async function BlogListPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; author_type?: string; sort?: string }>;
}) {
  return <BlogListContent searchParams={searchParams} />;
}
