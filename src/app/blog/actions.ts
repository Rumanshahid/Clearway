"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBlogIdentity } from "@/lib/blog-identity";
import { checkAlarmingContent, notifySuperAdminsOfFlag } from "@/lib/blog-moderation";
import { notifyFollowersOfNewContent } from "@/lib/follows";
import { slugify } from "@/lib/blog";

function readPostFields(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const tags = String(formData.get("tags") || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return {
    title,
    content: String(formData.get("content") || ""),
    tags,
  };
}

// Public composer for staff and patient authors -- unlike the admin panel
// (super_admin only, supports drafts/SEO/cover images), this is the
// simple "write a post" flow reachable from /blog itself: publish
// immediately, then redirect back to /blog (the list page the "create a
// blog" link was clicked from), per the product spec.
export async function createBlogPostAction(formData: FormData) {
  const identity = await requireBlogIdentity("/blog/new");
  const fields = readPostFields(formData);
  if (!fields.title || !fields.content.trim()) {
    redirect(`/blog/new?error=${encodeURIComponent("Title and content are required.")}`);
  }

  const supabase = await createClient();
  const slug = `${slugify(fields.title)}-${Date.now().toString(36)}`;

  const { flagged, reason } = await checkAlarmingContent(`${fields.title}\n\n${fields.content}`);

  const { data: post, error } = await supabase
    .from("blog_posts")
    .insert({
      title: fields.title,
      slug,
      content: fields.content,
      tags: fields.tags,
      status: "published",
      author_type: identity.authorType,
      author_id: identity.authorId,
      patient_author_id: identity.patientAuthorId,
      published_at: new Date().toISOString(),
      ai_flagged: flagged,
      ai_flag_reason: reason,
    })
    .select("id, slug")
    .single();

  if (error || !post) {
    redirect(`/blog/new?error=${encodeURIComponent(error?.message || "Could not publish your post.")}`);
  }

  if (flagged) {
    await notifySuperAdminsOfFlag({
      message: `A new blog post by ${identity.displayName} was flagged by AI review: ${reason || "no reason given"}`,
      link: `/blog/${post.slug}`,
    });
  }

  await notifyFollowersOfNewContent(identity.userId, `${identity.displayName} published a new blog post: "${fields.title}"`, `/blog/${post.slug}`);

  revalidatePath("/blog");
  redirect("/blog");
}

export async function updateOwnBlogPostAction(formData: FormData) {
  const identity = await requireBlogIdentity("/blog");
  const postId = String(formData.get("post_id") || "");
  const slug = String(formData.get("slug") || "");
  const fields = readPostFields(formData);
  if (!fields.title || !fields.content.trim()) {
    redirect(`/blog/${slug}/edit?error=${encodeURIComponent("Title and content are required.")}`);
  }

  const supabase = await createClient();
  // RLS (blog_posts_update_own_or_admin) enforces ownership/super_admin --
  // this update simply fails silently (0 rows affected) for anyone else,
  // no separate authorization check needed here.
  const { flagged, reason } = await checkAlarmingContent(`${fields.title}\n\n${fields.content}`);
  const { error } = await supabase
    .from("blog_posts")
    .update({
      title: fields.title,
      content: fields.content,
      tags: fields.tags,
      ai_flagged: flagged,
      ai_flag_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);

  if (error) {
    redirect(`/blog/${slug}/edit?error=${encodeURIComponent(error.message)}`);
  }

  if (flagged) {
    await notifySuperAdminsOfFlag({
      message: `A blog post by ${identity.displayName} was edited and flagged by AI review: ${reason || "no reason given"}`,
      link: `/blog/${slug}`,
    });
  }

  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  redirect("/blog");
}

export async function deleteOwnBlogPostAction(formData: FormData) {
  await requireBlogIdentity("/blog");
  const postId = String(formData.get("post_id") || "");
  const supabase = await createClient();
  await supabase.from("blog_posts").delete().eq("id", postId);

  revalidatePath("/blog");
  redirect("/blog");
}

export async function toggleLikeAction(formData: FormData) {
  const postId = String(formData.get("post_id") || "");
  const slug = String(formData.get("slug") || "");
  const identity = await requireBlogIdentity(`/blog/${slug}`);

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("blog_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", identity.userId)
    .maybeSingle();

  if (existing) {
    await supabase.from("blog_likes").delete().eq("post_id", postId).eq("user_id", identity.userId);
  } else {
    await supabase.from("blog_likes").insert({ post_id: postId, user_id: identity.userId });
  }

  revalidatePath(`/blog/${slug}`);
}

export async function toggleUpvoteAction(formData: FormData) {
  const postId = String(formData.get("post_id") || "");
  const slug = String(formData.get("slug") || "");
  const identity = await requireBlogIdentity(`/blog/${slug}`);

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("blog_upvotes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", identity.userId)
    .maybeSingle();

  if (existing) {
    await supabase.from("blog_upvotes").delete().eq("post_id", postId).eq("user_id", identity.userId);
  } else {
    await supabase.from("blog_upvotes").insert({ post_id: postId, user_id: identity.userId });
  }

  revalidatePath(`/blog/${slug}`);
  revalidatePath("/blog");
}

export async function addCommentAction(formData: FormData) {
  const postId = String(formData.get("post_id") || "");
  const slug = String(formData.get("slug") || "");
  const content = String(formData.get("content") || "").trim();
  const identity = await requireBlogIdentity(`/blog/${slug}`);

  if (!content) redirect(`/blog/${slug}?error=${encodeURIComponent("Comment can't be empty.")}`);

  const supabase = await createClient();
  const { flagged, reason } = await checkAlarmingContent(content);

  await supabase.from("blog_comments").insert({
    post_id: postId,
    user_id: identity.userId,
    content,
    ai_flagged: flagged,
    ai_flag_reason: reason,
  });

  if (flagged) {
    await notifySuperAdminsOfFlag({
      message: `A comment by ${identity.displayName} was flagged by AI review: ${reason || "no reason given"}`,
      link: `/blog/${slug}`,
    });
  }

  revalidatePath(`/blog/${slug}`);
}

export async function editCommentAction(formData: FormData) {
  const commentId = String(formData.get("comment_id") || "");
  const slug = String(formData.get("slug") || "");
  const content = String(formData.get("content") || "").trim();
  await requireBlogIdentity(`/blog/${slug}`);

  if (!content) redirect(`/blog/${slug}?error=${encodeURIComponent("Comment can't be empty.")}`);

  const supabase = await createClient();
  // RLS (blog_comments_update_own) restricts this to the comment's own
  // author -- a super_admin can delete a comment but not silently rewrite it.
  await supabase
    .from("blog_comments")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", commentId);

  revalidatePath(`/blog/${slug}`);
}

export async function deleteCommentAction(formData: FormData) {
  const commentId = String(formData.get("comment_id") || "");
  const slug = String(formData.get("slug") || "");
  await requireBlogIdentity(`/blog/${slug}`);

  const supabase = await createClient();
  // RLS (blog_comments_delete_own_or_admin) allows the comment's own
  // author OR a super_admin -- no extra check needed here.
  await supabase.from("blog_comments").delete().eq("id", commentId);

  revalidatePath(`/blog/${slug}`);
}
