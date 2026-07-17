import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import "../../../landing.css";
import SiteNav from "../../../SiteNav";
import SiteFooter from "../../../SiteFooter";
import LandingScripts from "../../../LandingScripts";
import { createClient } from "@/lib/supabase/server";
import { requireBlogIdentity } from "@/lib/blog-identity";
import { updateOwnBlogPostAction } from "../../actions";

export default async function EditBlogPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;
  const identity = await requireBlogIdentity(`/blog/${slug}/edit`);

  const supabase = await createClient();
  const { data: post } = await supabase.from("blog_posts").select("*").eq("slug", slug).maybeSingle();
  if (!post) notFound();

  const isOwner = (post.author_id && post.author_id === identity.userId) || (post.patient_author_id && post.patient_author_id === identity.userId);
  if (!isOwner && !identity.isSuperAdmin) redirect(`/blog/${slug}`);

  return (
    <div className="landing-root">
      <SiteNav />
      <div className="max-w-[720px] mx-auto px-5 sm:px-10 py-14">
        <Link href={`/blog/${slug}`} className="text-[13px] text-indigo-600 font-medium">← Back to post</Link>
        <h1 className="text-[26px] font-semibold mt-4 mb-6">Edit post</h1>

        {error && (
          <div className="mb-4 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
            {error}
          </div>
        )}

        <form action={updateOwnBlogPostAction} className="flex flex-col gap-4">
          <input type="hidden" name="post_id" value={post.id} />
          <input type="hidden" name="slug" value={post.slug} />
          <div>
            <label className="label" htmlFor="title">Title</label>
            <input className="input" id="title" name="title" defaultValue={post.title} required />
          </div>
          <div>
            <label className="label" htmlFor="tags">Tags (comma-separated)</label>
            <input className="input" id="tags" name="tags" defaultValue={post.tags.join(", ")} />
          </div>
          <div>
            <label className="label" htmlFor="content">Content (Markdown supported)</label>
            <textarea className="input" id="content" name="content" rows={16} defaultValue={post.content} required />
          </div>
          <button type="submit" className="btn btn-primary w-full justify-center mt-2">Save changes →</button>
        </form>
      </div>
      <SiteFooter />
      <LandingScripts />
    </div>
  );
}
