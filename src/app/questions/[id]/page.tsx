import Link from "next/link";
import { notFound } from "next/navigation";
import "../../landing.css";
import SiteNav from "../../SiteNav";
import SiteFooter from "../../SiteFooter";
import LandingScripts from "../../LandingScripts";
import { createClient } from "@/lib/supabase/server";
import { getPublicIdentities } from "@/lib/blog-identity";
import { toggleFollowAction } from "../../social-actions";
import {
  toggleQuestionLikeAction,
  toggleQuestionUpvoteAction,
  toggleAnswerLikeAction,
  toggleAnswerUpvoteAction,
  deleteOwnQuestionAction,
  addAnswerAction,
  editAnswerAction,
  deleteAnswerAction,
} from "../actions";

export default async function QuestionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const supabase = await createClient();
  const { data: question } = await supabase.from("questions").select("*").eq("id", id).maybeSingle();
  if (!question) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: questionLikes }, { data: questionUpvotes }, { data: answers }] = await Promise.all([
    user ? supabase.from("profiles").select("role").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("question_likes").select("user_id").eq("question_id", question.id),
    supabase.from("question_upvotes").select("user_id").eq("question_id", question.id),
    supabase.from("answers").select("*").eq("question_id", question.id).order("upvote_count", { ascending: false }),
  ]);

  const isSuperAdmin = profile?.role === "super_admin";
  const questionAuthorUserId = question.author_id || question.patient_author_id;
  const isQuestionOwner = !!user && questionAuthorUserId === user.id;
  const isQuestionLiked = !!user && (questionLikes || []).some((l) => l.user_id === user.id);
  const isQuestionUpvoted = !!user && (questionUpvotes || []).some((v) => v.user_id === user.id);

  const answerIds = (answers || []).map((a) => a.id);
  const [{ data: answerLikes }, { data: answerUpvotes }] = await Promise.all([
    answerIds.length ? supabase.from("answer_likes").select("answer_id, user_id").in("answer_id", answerIds) : Promise.resolve({ data: [] }),
    answerIds.length ? supabase.from("answer_upvotes").select("answer_id, user_id").in("answer_id", answerIds) : Promise.resolve({ data: [] }),
  ]);

  const identities = await getPublicIdentities([
    ...(questionAuthorUserId ? [questionAuthorUserId] : []),
    ...(answers || []).map((a) => a.author_id || a.patient_author_id).filter((v): v is string => !!v),
  ]);
  const questionAuthorIdentity = questionAuthorUserId ? identities[questionAuthorUserId] : undefined;

  const isFollowingAuthor =
    !!user && !!questionAuthorUserId
      ? !!(await supabase.from("user_follows").select("follower_id").eq("follower_id", user.id).eq("followed_id", questionAuthorUserId).maybeSingle()).data
      : false;

  return (
    <div className="landing-root">
      <SiteNav />
      <div className="max-w-[720px] mx-auto px-5 sm:px-10 py-14">
        <Link href="/questions" className="text-[13px] text-indigo-600 font-medium">← Back to Questions</Link>

        <div className="flex items-center gap-3 text-[13px] text-gray-400 mt-4 mb-2 flex-wrap">
          {questionAuthorIdentity && <span className="text-gray-600 font-medium">{questionAuthorIdentity.displayName}</span>}
          <span>{new Date(question.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</span>
          {user && questionAuthorUserId && questionAuthorUserId !== user.id && (
            <form action={toggleFollowAction}>
              <input type="hidden" name="target_user_id" value={questionAuthorUserId} />
              <input type="hidden" name="redirect_to" value={`/questions/${question.id}`} />
              <button type="submit" className="text-[12.5px] font-medium" style={{ color: "var(--indigo-600)" }}>
                {isFollowingAuthor ? "Following" : "+ Follow"}
              </button>
            </form>
          )}
          {(isQuestionOwner || isSuperAdmin) && (
            <div className="flex items-center gap-3 ml-auto">
              <Link href={`/questions/${question.id}/edit`} className="text-indigo-600 font-medium">Edit</Link>
              <form action={deleteOwnQuestionAction}>
                <input type="hidden" name="question_id" value={question.id} />
                <button type="submit" className="text-btn text-[13px]" style={{ color: "var(--danger-red)" }}>Delete</button>
              </form>
            </div>
          )}
        </div>

        <h1 className="text-[26px] font-semibold mb-3">{question.title}</h1>
        {question.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {question.tags.map((t) => (
              <Link key={t} href={`/questions?tag=${encodeURIComponent(t)}`} className="text-[12px] text-gray-400 hover:text-indigo-600">#{t}</Link>
            ))}
          </div>
        )}
        {question.body && <p className="text-[15px] text-gray-700 leading-relaxed whitespace-pre-wrap mb-6">{question.body}</p>}

        <div className="flex items-center gap-3 mb-10">
          <form action={toggleQuestionLikeAction}>
            <input type="hidden" name="question_id" value={question.id} />
            <button type="submit" className="btn" style={isQuestionLiked ? { background: "var(--indigo-600)", color: "#fff" } : undefined}>
              {isQuestionLiked ? "♥ Liked" : "♡ Like"} ({(questionLikes || []).length})
            </button>
          </form>
          <form action={toggleQuestionUpvoteAction}>
            <input type="hidden" name="question_id" value={question.id} />
            <button type="submit" className="btn" style={isQuestionUpvoted ? { background: "var(--indigo-600)", color: "#fff" } : undefined}>
              ▲ Upvote ({question.upvote_count})
            </button>
          </form>
        </div>

        <section>
          <h2 className="text-[16px] font-semibold mb-4">{(answers || []).length} Answer{(answers || []).length === 1 ? "" : "s"}</h2>

          {error && (
            <div className="mb-4 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
              {error}
            </div>
          )}

          {user ? (
            <form action={addAnswerAction} className="flex flex-col gap-2 mb-8">
              <input type="hidden" name="question_id" value={question.id} />
              <textarea className="input" name="content" rows={4} placeholder="Write an answer…" required />
              <button type="submit" className="btn btn-primary self-start">Post answer</button>
            </form>
          ) : (
            <p className="text-[13.5px] text-gray-500 mb-8">
              <Link href={`/sign-in?next=${encodeURIComponent(`/questions/${question.id}`)}`} className="text-indigo-600 font-medium">Sign in</Link> to like, upvote, or answer.
            </p>
          )}

          <div className="flex flex-col gap-6">
            {(answers || []).map((answer) => {
              const authorUserId = answer.author_id || answer.patient_author_id;
              const answerer = authorUserId ? identities[authorUserId] : undefined;
              const canModify = !!user && authorUserId === user.id;
              const isLiked = !!user && (answerLikes || []).some((l) => l.answer_id === answer.id && l.user_id === user.id);
              const isUpvoted = !!user && (answerUpvotes || []).some((v) => v.answer_id === answer.id && v.user_id === user.id);
              const likeCount = (answerLikes || []).filter((l) => l.answer_id === answer.id).length;

              return (
                <div key={answer.id} className="flex gap-3 pb-6" style={{ borderBottom: "1px solid var(--gray-200)" }}>
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-[12px] font-semibold text-gray-600 flex-shrink-0 overflow-hidden">
                    {answerer?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={answerer.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (answerer?.displayName || "?").charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-[13px] mb-1">
                      <span className="font-semibold text-gray-900">{answerer?.displayName || "Unknown"}</span>
                      <span className="text-gray-400">{new Date(answer.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[14px] text-gray-700 whitespace-pre-wrap mb-2">{answer.content}</p>
                    <div className="flex items-center gap-2 mb-1">
                      <form action={toggleAnswerLikeAction}>
                        <input type="hidden" name="answer_id" value={answer.id} />
                        <input type="hidden" name="question_id" value={question.id} />
                        <button
                          type="submit"
                          className="btn btn-sm"
                          style={isLiked ? { background: "var(--indigo-600)", color: "#fff" } : { background: "var(--gray-100)", color: "var(--gray-600)" }}
                        >
                          {isLiked ? "♥" : "♡"} {likeCount}
                        </button>
                      </form>
                      <form action={toggleAnswerUpvoteAction}>
                        <input type="hidden" name="answer_id" value={answer.id} />
                        <input type="hidden" name="question_id" value={question.id} />
                        <button
                          type="submit"
                          className="btn btn-sm"
                          style={isUpvoted ? { background: "var(--indigo-600)", color: "#fff" } : { background: "var(--gray-100)", color: "var(--gray-600)" }}
                        >
                          ▲ {answer.upvote_count}
                        </button>
                      </form>
                    </div>
                    {(canModify || isSuperAdmin) && (
                      <div className="flex items-center gap-3">
                        {canModify && (
                          <details className="inline-block">
                            <summary className="text-[12.5px] text-indigo-600 font-medium cursor-pointer list-none">Edit</summary>
                            <form action={editAnswerAction} className="flex flex-col gap-2 mt-2">
                              <input type="hidden" name="answer_id" value={answer.id} />
                              <input type="hidden" name="question_id" value={question.id} />
                              <textarea className="input" name="content" rows={3} defaultValue={answer.content} required />
                              <button type="submit" className="btn btn-primary self-start text-[12.5px]">Save</button>
                            </form>
                          </details>
                        )}
                        <form action={deleteAnswerAction}>
                          <input type="hidden" name="answer_id" value={answer.id} />
                          <input type="hidden" name="question_id" value={question.id} />
                          <button type="submit" className="text-btn text-[12.5px]" style={{ color: "var(--danger-red)" }}>Delete</button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {(answers || []).length === 0 && <p className="text-gray-400 text-[13.5px]">No answers yet — be the first to help.</p>}
          </div>
        </section>
      </div>
      <SiteFooter />
      <LandingScripts />
    </div>
  );
}
