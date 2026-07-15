import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BlogPostForm from "../BlogPostForm";
import DeletePostButton from "../DeletePostButton";
import { updatePostAction } from "../actions";

export default async function EditBlogPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { id } = await params;
  const { error, saved } = await searchParams;
  const supabase = await createClient();

  const { data: post } = await supabase.from("blog_posts").select("*").eq("id", id).maybeSingle();
  if (!post) notFound();

  return (
    <div className="max-w-[900px] mx-auto py-8 px-5">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px] font-semibold">Edit post</h1>
        <div className="flex items-center gap-3">
          {post.status === "published" && (
            <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className="text-[13px] text-indigo-600 font-medium">
              View live →
            </a>
          )}
          <DeletePostButton postId={post.id} />
        </div>
      </div>

      {error && (
        <div className="mb-5 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
          {error}
        </div>
      )}
      {saved && !error && (
        <div className="mb-5 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--success-bg)", color: "var(--success-green)" }}>
          Saved.
        </div>
      )}

      <BlogPostForm post={post} action={updatePostAction} />
    </div>
  );
}
