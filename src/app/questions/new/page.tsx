import Link from "next/link";
import "../../landing.css";
import SiteNav from "../../SiteNav";
import SiteFooter from "../../SiteFooter";
import LandingScripts from "../../LandingScripts";
import { requireBlogIdentity } from "@/lib/blog-identity";
import { createQuestionAction } from "../actions";

export const metadata = { title: "Ask a question — asaanbil.com" };

export default async function NewQuestionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireBlogIdentity("/questions/new");
  const { error } = await searchParams;

  return (
    <div className="landing-root">
      <SiteNav />
      <div className="wrap" style={{ paddingTop: 56, paddingBottom: 56 }}>
      <div className="max-w-[720px] mx-auto">
        <Link href="/questions" className="text-[13px] text-indigo-600 font-medium">← Back to Questions</Link>
        <h1 className="text-[26px] font-semibold mt-4 mb-1">Ask a question</h1>
        <p className="text-[14px] text-gray-600 mb-8">Your question posts immediately — doctors, staff, and other patients can answer.</p>

        {error && (
          <div className="mb-4 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
            {error}
          </div>
        )}

        <form action={createQuestionAction} className="flex flex-col gap-4">
          <div>
            <label className="label" htmlFor="title">Title</label>
            <input className="input" id="title" name="title" required />
          </div>
          <div>
            <label className="label" htmlFor="tags">Tags (comma-separated)</label>
            <input className="input" id="tags" name="tags" placeholder="insurance, appeals" />
          </div>
          <div>
            <label className="label" htmlFor="body">Details</label>
            <textarea className="input" id="body" name="body" rows={10} />
          </div>
          <button type="submit" className="btn btn-primary w-full justify-center mt-2">Post question →</button>
        </form>
      </div>
      </div>
      <SiteFooter />
      <LandingScripts />
    </div>
  );
}
