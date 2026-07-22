import Link from "next/link";
import { redirect } from "next/navigation";
import "../../landing.css";
import SiteNav from "../../SiteNav";
import SiteFooter from "../../SiteFooter";
import LandingScripts from "../../LandingScripts";
import { requireBlogIdentity } from "@/lib/blog-identity";
import { createBlogPostAction } from "../actions";

export const metadata = { title: "Write a post — asaanbil.com Blog" };

// Extracted so /patient/blog/new (unreachable today -- patients can't
// write posts) and /doctor/blog/new can render the same composer under
// their own URL prefix. createBlogPostAction reads the base_path hidden
// field to redirect back to whichever prefix this was reached from.
export async function NewBlogPostContent({
  error,
  basePath = "/blog",
  showChrome = true,
}: {
  error?: string;
  basePath?: string;
  showChrome?: boolean;
}) {
  const identity = await requireBlogIdentity(`${basePath}/new`);
  // Patients can read/like/comment but not author posts.
  if (identity.authorType === "patient") redirect(basePath);

  const content = (
    <div className="wrap" style={{ width: "100%", paddingTop: 56, paddingBottom: 56 }}>
      <div className="max-w-[720px] mx-auto">
        <Link href={basePath} className="text-[13px] text-indigo-600 font-medium">← Back to Blog</Link>
        <h1 className="text-[26px] font-semibold mt-4 mb-1">Write a post</h1>
        <p className="text-[14px] text-gray-600 mb-8">Your post publishes immediately and appears in the blog list right away.</p>

        {error && (
          <div className="mb-4 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
            {error}
          </div>
        )}

        <form action={createBlogPostAction} className="flex flex-col gap-4">
          <input type="hidden" name="base_path" value={basePath} />
          <div>
            <label className="label" htmlFor="title">Title</label>
            <input className="input" id="title" name="title" required />
          </div>
          <div>
            <label className="label" htmlFor="tags">Tags (comma-separated)</label>
            <input className="input" id="tags" name="tags" placeholder="prior authorization, claims" />
          </div>
          <div>
            <label className="label" htmlFor="content">Content (Markdown supported)</label>
            <textarea className="input" id="content" name="content" rows={16} required />
          </div>
          <button type="submit" className="btn btn-primary w-full justify-center mt-2">Publish →</button>
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

export default async function NewBlogPostPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return <NewBlogPostContent error={error} />;
}
