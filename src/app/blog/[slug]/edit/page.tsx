import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import "../../../landing.css";
import SiteNav from "../../../SiteNav";
import SiteFooter from "../../../SiteFooter";
import LandingScripts from "../../../LandingScripts";
import { createClient } from "@/lib/supabase/server";
import { requireBlogIdentity } from "@/lib/blog-identity";
import { updateOwnBlogPostAction } from "../../actions";

// Extracted so /doctor/blog/[slug]/edit can render the same editor under
// its own URL prefix -- updateOwnBlogPostAction reads the base_path hidden
// field to redirect back to whichever prefix this was reached from.
export async function EditBlogPostContent({
  slug,
  error,
  basePath = "/blog",
  showChrome = true,
}: {
  slug: string;
  error?: string;
  basePath?: string;
  showChrome?: boolean;
}) {
  const identity = await requireBlogIdentity(`${basePath}/${slug}/edit`);

  const supabase = await createClient();
  const { data: post } = await supabase.from("blog_posts").select("*").eq("slug", slug).maybeSingle();
  if (!post) notFound();

  const isOwner = (post.author_id && post.author_id === identity.userId) || (post.patient_author_id && post.patient_author_id === identity.userId);
  if (!isOwner && !identity.isSuperAdmin) redirect(`${basePath}/${slug}`);

  const content = (
    <div className="wrap" style={{ width: "100%", paddingTop: 56, paddingBottom: 56 }}>
      <div className="max-w-[720px] mx-auto">
        <Link href={`${basePath}/${slug}`} className="text-[13px] text-indigo-600 font-medium">← Back to post</Link>
        <h1 className="text-[26px] font-semibold mt-4 mb-6">Edit post</h1>

        {error && (
          <div className="mb-4 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
            {error}
          </div>
        )}

        <form action={updateOwnBlogPostAction} className="flex flex-col gap-4">
          <input type="hidden" name="post_id" value={post.id} />
          <input type="hidden" name="slug" value={post.slug} />
          <input type="hidden" name="base_path" value={basePath} />
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

export default async function EditBlogPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;
  return <EditBlogPostContent slug={slug} error={error} />;
}
