import Link from "next/link";
import { excerptFrom } from "@/lib/blog";
import type { PublicIdentity } from "@/lib/blog-identity";
import { toggleFollowAction } from "../social-actions";
import { toggleLikeAction, addCommentAction, editCommentAction, deleteCommentAction, deleteOwnBlogPostAction } from "./actions";
import ShareButton from "./ShareButton";
import CollapsibleComments from "./CollapsibleComments";

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  tags: string[];
  author_type: "staff" | "patient";
  author_id: string | null;
  patient_author_id: string | null;
  published_at: string | null;
}

function Avatar({ identity }: { identity?: PublicIdentity }) {
  return (
    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-[13px] font-semibold text-gray-600 flex-shrink-0 overflow-hidden">
      {identity?.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={identity.avatarUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        (identity?.displayName || "?").charAt(0).toUpperCase()
      )}
    </div>
  );
}

const actionBtn = "flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors";

export default function PostCard({
  post,
  basePath,
  currentUserId,
  isSuperAdmin,
  authorIdentity,
  authorUserId,
  isFollowingAuthor,
  likeCount,
  isLiked,
  comments,
  commenterIdentities,
}: {
  post: Post;
  basePath: string;
  currentUserId: string | null;
  isSuperAdmin: boolean;
  authorIdentity?: PublicIdentity;
  authorUserId: string | null;
  isFollowingAuthor: boolean;
  likeCount: number;
  isLiked: boolean;
  comments: Comment[];
  commenterIdentities: Record<string, PublicIdentity>;
}) {
  const isOwner = !!currentUserId && authorUserId === currentUserId;
  const postUrl = `${basePath}/${post.slug}`;

  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <Avatar identity={authorIdentity} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-[14px]">
              {authorIdentity?.displayName || (post.author_type === "patient" ? "Patient" : "Staff")}
            </span>
            {currentUserId && authorUserId && authorUserId !== currentUserId && (
              <form action={toggleFollowAction}>
                <input type="hidden" name="target_user_id" value={authorUserId} />
                <input type="hidden" name="redirect_to" value={basePath} />
                <button type="submit" className="text-[12.5px] font-medium" style={{ color: "var(--indigo-600)" }}>
                  {isFollowingAuthor ? "Following" : "+ Follow"}
                </button>
              </form>
            )}
          </div>
          <div className="text-[12px] text-gray-400">
            {post.published_at && new Date(post.published_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
          </div>
        </div>
        {(isOwner || isSuperAdmin) && (
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link href={`${postUrl}/edit`} className="text-[12.5px] text-indigo-600 font-medium">Edit</Link>
            <form action={deleteOwnBlogPostAction}>
              <input type="hidden" name="post_id" value={post.id} />
              <input type="hidden" name="base_path" value={basePath} />
              <button type="submit" className="text-btn text-[12.5px]" style={{ color: "var(--danger-red)" }}>Delete</button>
            </form>
          </div>
        )}
      </div>

      <Link href={postUrl}>
        <h2 className="text-[18px] font-semibold mb-1 hover:text-indigo-600 transition-colors">{post.title}</h2>
        <p className="text-[14px] text-gray-700 leading-relaxed">{post.excerpt || excerptFrom(post.content, 280)}</p>
      </Link>

      {post.cover_image_url && (
        <Link href={postUrl}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.cover_image_url} alt="" className="w-full h-auto rounded-lg" />
        </Link>
      )}

      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {post.tags.map((t) => (
            <Link key={t} href={`${basePath}?tag=${encodeURIComponent(t)}`} className="text-[11.5px] text-gray-400 hover:text-indigo-600">#{t}</Link>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-5 pt-3" style={{ borderTop: "1px solid var(--gray-200)" }}>
        <form action={toggleLikeAction}>
          <input type="hidden" name="post_id" value={post.id} />
          <input type="hidden" name="slug" value={post.slug} />
          <button type="submit" className={actionBtn} style={isLiked ? { color: "var(--indigo-600)" } : undefined}>
            {isLiked ? "♥" : "♡"} Like{likeCount > 0 ? ` (${likeCount})` : ""}
          </button>
        </form>

        <ShareButton path={postUrl} />

        <CollapsibleComments label={`Comment${comments.length > 0 ? ` (${comments.length})` : ""}`}>
          {currentUserId ? (
            <form action={addCommentAction} className="flex flex-col gap-2 mb-4">
              <input type="hidden" name="post_id" value={post.id} />
              <input type="hidden" name="slug" value={post.slug} />
              <textarea className="input" name="content" rows={2} placeholder="Add a comment…" required />
              <button type="submit" className="btn btn-primary btn-sm self-start">Comment</button>
            </form>
          ) : (
            <p className="text-[13.5px] text-gray-500 mb-4">
              <Link href={`/sign-in?next=${encodeURIComponent(postUrl)}`} className="text-indigo-600 font-medium">Sign in</Link> to like or comment.
            </p>
          )}

          <div className="flex flex-col gap-4">
            {comments.map((comment) => {
              const commenter = commenterIdentities[comment.user_id];
              const canModify = comment.user_id === currentUserId;
              return (
                <div key={comment.id} className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[11px] font-semibold text-gray-600 flex-shrink-0 overflow-hidden">
                    {commenter?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={commenter.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (commenter?.displayName || "?").charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-[12.5px]">
                      <span className="font-semibold text-gray-900">{commenter?.displayName || "Unknown"}</span>
                      <span className="text-gray-400">{new Date(comment.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[13.5px] text-gray-700 whitespace-pre-wrap mt-0.5">{comment.content}</p>
                    {(canModify || isSuperAdmin) && (
                      <div className="flex items-center gap-3 mt-1">
                        {canModify && (
                          <details className="inline-block">
                            <summary className="text-[12px] text-indigo-600 font-medium cursor-pointer list-none">Edit</summary>
                            <form action={editCommentAction} className="flex flex-col gap-2 mt-2">
                              <input type="hidden" name="comment_id" value={comment.id} />
                              <input type="hidden" name="slug" value={post.slug} />
                              <textarea className="input" name="content" rows={2} defaultValue={comment.content} required />
                              <button type="submit" className="btn btn-primary btn-sm self-start">Save</button>
                            </form>
                          </details>
                        )}
                        <form action={deleteCommentAction}>
                          <input type="hidden" name="comment_id" value={comment.id} />
                          <input type="hidden" name="slug" value={post.slug} />
                          <button type="submit" className="text-btn text-[12px]" style={{ color: "var(--danger-red)" }}>Delete</button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {comments.length === 0 && <p className="text-gray-400 text-[13px]">No comments yet.</p>}
          </div>
        </CollapsibleComments>
      </div>
    </div>
  );
}
