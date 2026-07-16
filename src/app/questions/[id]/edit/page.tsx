import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import "../../../landing.css";
import SiteNav from "../../../SiteNav";
import SiteFooter from "../../../SiteFooter";
import LandingScripts from "../../../LandingScripts";
import { createClient } from "@/lib/supabase/server";
import { requireBlogIdentity } from "@/lib/blog-identity";
import { updateOwnQuestionAction } from "../../actions";

export default async function EditQuestionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const identity = await requireBlogIdentity(`/questions/${id}/edit`);

  const supabase = await createClient();
  const { data: question } = await supabase.from("questions").select("*").eq("id", id).maybeSingle();
  if (!question) notFound();

  const isOwner = (question.author_id && question.author_id === identity.userId) || (question.patient_author_id && question.patient_author_id === identity.userId);
  if (!isOwner && !identity.isSuperAdmin) redirect(`/questions/${id}`);

  return (
    <div className="landing-root">
      <SiteNav />
      <div className="max-w-[720px] mx-auto px-5 py-14">
        <Link href={`/questions/${id}`} className="text-[13px] text-indigo-600 font-medium">← Back to question</Link>
        <h1 className="text-[26px] font-semibold mt-4 mb-6">Edit question</h1>

        {error && (
          <div className="mb-4 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
            {error}
          </div>
        )}

        <form action={updateOwnQuestionAction} className="flex flex-col gap-4">
          <input type="hidden" name="question_id" value={question.id} />
          <div>
            <label className="label" htmlFor="title">Title</label>
            <input className="input" id="title" name="title" defaultValue={question.title} required />
          </div>
          <div>
            <label className="label" htmlFor="tags">Tags (comma-separated)</label>
            <input className="input" id="tags" name="tags" defaultValue={question.tags.join(", ")} />
          </div>
          <div>
            <label className="label" htmlFor="body">Details</label>
            <textarea className="input" id="body" name="body" rows={10} defaultValue={question.body} />
          </div>
          <button type="submit" className="btn btn-primary w-full justify-center mt-2">Save changes →</button>
        </form>
      </div>
      <SiteFooter />
      <LandingScripts />
    </div>
  );
}
