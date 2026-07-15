"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionProfile } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/blog";
import type { BlogPostStatus } from "@/lib/database.types";

function requireSuperAdmin(role: string) {
  if (role !== "super_admin") redirect("/dashboard");
}

async function uploadCoverImage(supabase: Awaited<ReturnType<typeof createClient>>, slug: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${slug}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("blog-images").upload(path, file, { upsert: true });
  if (error) throw new Error(`Cover image upload failed: ${error.message}`);
  return supabase.storage.from("blog-images").getPublicUrl(path).data.publicUrl;
}

function readPostFields(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const slugInput = String(formData.get("slug") || "").trim();
  const status = (String(formData.get("status") || "draft") as BlogPostStatus);
  const tags = String(formData.get("tags") || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return {
    title,
    slug: slugInput ? slugify(slugInput) : slugify(title),
    excerpt: String(formData.get("excerpt") || "").trim() || null,
    content: String(formData.get("content") || ""),
    tags,
    status,
    seo_title: String(formData.get("seo_title") || "").trim() || null,
    seo_description: String(formData.get("seo_description") || "").trim() || null,
  };
}

export async function createPostAction(formData: FormData) {
  const session = await getSessionProfile();
  requireSuperAdmin(session.role);
  const supabase = await createClient();

  const fields = readPostFields(formData);
  if (!fields.title) {
    redirect(`/admin/blog/new?error=${encodeURIComponent("A title is required.")}`);
  }

  const coverImageFile = formData.get("cover_image") as File | null;
  let coverImageUrl: string | null = null;
  if (coverImageFile && coverImageFile.size > 0) {
    try {
      coverImageUrl = await uploadCoverImage(supabase, fields.slug, coverImageFile);
    } catch (err) {
      redirect(`/admin/blog/new?error=${encodeURIComponent(err instanceof Error ? err.message : "Cover image upload failed.")}`);
    }
  }

  const { data: post, error } = await supabase
    .from("blog_posts")
    .insert({
      ...fields,
      cover_image_url: coverImageUrl,
      author_id: session.userId,
      published_at: fields.status === "published" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/admin/blog/new?error=${encodeURIComponent(error.message.includes("duplicate") ? "That slug is already taken." : error.message)}`);
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  redirect(`/admin/blog/${post!.id}?saved=1`);
}

export async function updatePostAction(formData: FormData) {
  const session = await getSessionProfile();
  requireSuperAdmin(session.role);
  const supabase = await createClient();

  const postId = String(formData.get("post_id") || "");
  const fields = readPostFields(formData);
  if (!fields.title) {
    redirect(`/admin/blog/${postId}?error=${encodeURIComponent("A title is required.")}`);
  }

  const { data: existing } = await supabase.from("blog_posts").select("cover_image_url, published_at, status").eq("id", postId).single();

  const coverImageFile = formData.get("cover_image") as File | null;
  let coverImageUrl = existing?.cover_image_url || null;
  if (coverImageFile && coverImageFile.size > 0) {
    try {
      coverImageUrl = await uploadCoverImage(supabase, fields.slug, coverImageFile);
    } catch (err) {
      redirect(`/admin/blog/${postId}?error=${encodeURIComponent(err instanceof Error ? err.message : "Cover image upload failed.")}`);
    }
  }

  // Only stamp published_at the first time a post goes live -- re-saving an
  // already-published post, or toggling draft -> published -> draft -> published
  // again, shouldn't bump its original publish date.
  const publishedAt = fields.status === "published" ? existing?.published_at || new Date().toISOString() : existing?.published_at || null;

  const { error } = await supabase
    .from("blog_posts")
    .update({
      ...fields,
      cover_image_url: coverImageUrl,
      published_at: publishedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);

  if (error) {
    redirect(`/admin/blog/${postId}?error=${encodeURIComponent(error.message.includes("duplicate") ? "That slug is already taken." : error.message)}`);
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath(`/blog/${fields.slug}`);
  redirect(`/admin/blog/${postId}?saved=1`);
}

export async function deletePostAction(formData: FormData) {
  const session = await getSessionProfile();
  requireSuperAdmin(session.role);
  const supabase = await createClient();

  const postId = String(formData.get("post_id") || "");
  await supabase.from("blog_posts").delete().eq("id", postId);

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  redirect("/admin/blog");
}
