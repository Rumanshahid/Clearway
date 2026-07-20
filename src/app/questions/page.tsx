import Link from "next/link";
import "../landing.css";
import SiteNav from "../SiteNav";
import SiteFooter from "../SiteFooter";
import LandingScripts from "../LandingScripts";
import { createClient } from "@/lib/supabase/server";
import { excerptFrom } from "@/lib/blog";
import FiltersSidebar from "./FiltersSidebar";
import RecentQuestionsSidebar from "./RecentQuestionsSidebar";
import SiteSearchBar from "../SiteSearchBar";

export const metadata = {
  title: "Questions & Answers — asaanbil.com",
  description: "Ask a question, get answers from doctors, staff, and other patients.",
};

// Extracted so /patient/questions can render the same list under its own
// URL prefix, without the marketing chrome -- PatientLayout already
// supplies its own nav there.
export async function QuestionsListContent({
  searchParams,
  basePath = "/questions",
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

  let query = supabase.from("questions").select("id, title, body, tags, author_type, upvote_count, created_at");
  if (tag) query = query.contains("tags", [tag]);
  if (authorType === "staff" || authorType === "patient") query = query.eq("author_type", authorType);
  query = sort === "top" ? query.order("upvote_count", { ascending: false }) : query.order("created_at", { ascending: false });

  const { data: questions } = await query;

  const { data: allTagRows } = await supabase.from("questions").select("tags");
  const allTags = Array.from(new Set((allTagRows || []).flatMap((r) => r.tags))).sort();

  const { data: recent } = await supabase.from("questions").select("id, title").order("created_at", { ascending: false }).limit(6);

  const { data: answerCounts } = await supabase.from("answers").select("question_id");
  const answerCountByQuestion = (answerCounts || []).reduce<Record<string, number>>((acc, row) => {
    acc[row.question_id] = (acc[row.question_id] || 0) + 1;
    return acc;
  }, {});

  const content = (
    <div className="wrap" style={{ width: "100%", paddingTop: 56, paddingBottom: 56 }}>
      <div className="mb-8">
        <SiteSearchBar placeholder="Search questions…" />
      </div>

      <div className={`flex items-start gap-4 mb-2 flex-wrap ${showHeading ? "justify-between" : "justify-end"}`}>
        {showHeading && (
          <div>
            <h1 className="text-[32px] font-semibold mb-2">Questions &amp; Answers</h1>
            <p className="text-[15px] text-gray-600">Ask a question — doctors, staff, and other patients can answer.</p>
          </div>
        )}
        {user && <Link href={`${basePath}/new`} className="btn btn-primary flex-shrink-0">Ask a question →</Link>}
      </div>

      <div className="flex gap-6 items-start mt-8">
        <FiltersSidebar tag={tag} authorType={authorType} sort={sort} tagOptions={allTags} basePath={basePath} />

        <div className="flex-1 min-w-0 flex flex-col gap-6">
          {(questions || []).map((q) => (
            <Link key={q.id} href={`${basePath}/${q.id}`} className="card p-5 flex flex-col gap-2 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2 text-[12px] text-gray-400">
                <span>{new Date(q.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</span>
                <span>·</span>
                <span>{q.author_type === "patient" ? "Patient" : "Doctor/Staff"}</span>
                <span>·</span>
                <span>▲ {q.upvote_count}</span>
                <span>·</span>
                <span>{answerCountByQuestion[q.id] || 0} answer{(answerCountByQuestion[q.id] || 0) === 1 ? "" : "s"}</span>
              </div>
              <h2 className="text-[18px] font-semibold">{q.title}</h2>
              {q.body && <p className="text-[14px] text-gray-600 leading-relaxed">{excerptFrom(q.body)}</p>}
              {q.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {q.tags.map((t) => (
                    <span key={t} className="text-[11.5px] text-gray-400">#{t}</span>
                  ))}
                </div>
              )}
            </Link>
          ))}
          {(!questions || questions.length === 0) && (
            <p className="text-gray-400 text-center py-16">
              {tag ? `No questions tagged "${tag}" yet.` : "No questions yet — be the first to ask."}
            </p>
          )}
        </div>

        <RecentQuestionsSidebar questions={recent || []} basePath={basePath} />
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

export default async function QuestionsListPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; author_type?: string; sort?: string }>;
}) {
  return <QuestionsListContent searchParams={searchParams} />;
}
