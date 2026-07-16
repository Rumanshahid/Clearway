"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBlogIdentity } from "@/lib/blog-identity";
import { checkAlarmingContent, notifySuperAdminsOfFlag } from "@/lib/blog-moderation";
import { notifyFollowersOfNewContent } from "@/lib/follows";

export async function createQuestionAction(formData: FormData) {
  const identity = await requireBlogIdentity("/questions/new");
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const tags = String(formData.get("tags") || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (!title) redirect(`/questions/new?error=${encodeURIComponent("A title is required.")}`);

  const supabase = await createClient();
  const { flagged, reason } = await checkAlarmingContent(`${title}\n\n${body}`);

  const { data: question, error } = await supabase
    .from("questions")
    .insert({
      title,
      body,
      tags,
      author_type: identity.authorType,
      author_id: identity.authorId,
      patient_author_id: identity.patientAuthorId,
      ai_flagged: flagged,
      ai_flag_reason: reason,
    })
    .select("id")
    .single();

  if (error || !question) {
    redirect(`/questions/new?error=${encodeURIComponent(error?.message || "Could not post your question.")}`);
  }

  if (flagged) {
    await notifySuperAdminsOfFlag({
      message: `A new question by ${identity.displayName} was flagged by AI review: ${reason || "no reason given"}`,
      link: `/questions/${question.id}`,
    });
  }

  await notifyFollowersOfNewContent(identity.userId, `${identity.displayName} asked a new question: "${title}"`, `/questions/${question.id}`);

  revalidatePath("/questions");
  redirect(`/questions/${question.id}`);
}

export async function updateOwnQuestionAction(formData: FormData) {
  await requireBlogIdentity("/questions");
  const questionId = String(formData.get("question_id") || "");
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const tags = String(formData.get("tags") || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (!title) redirect(`/questions/${questionId}/edit?error=${encodeURIComponent("A title is required.")}`);

  const supabase = await createClient();
  const { flagged, reason } = await checkAlarmingContent(`${title}\n\n${body}`);
  // RLS (questions_update_own_or_admin) enforces ownership/super_admin.
  await supabase
    .from("questions")
    .update({ title, body, tags, ai_flagged: flagged, ai_flag_reason: reason, updated_at: new Date().toISOString() })
    .eq("id", questionId);

  revalidatePath("/questions");
  revalidatePath(`/questions/${questionId}`);
  redirect(`/questions/${questionId}`);
}

export async function deleteOwnQuestionAction(formData: FormData) {
  await requireBlogIdentity("/questions");
  const questionId = String(formData.get("question_id") || "");
  const supabase = await createClient();
  await supabase.from("questions").delete().eq("id", questionId);

  revalidatePath("/questions");
  redirect("/questions");
}

export async function addAnswerAction(formData: FormData) {
  const questionId = String(formData.get("question_id") || "");
  const content = String(formData.get("content") || "").trim();
  const identity = await requireBlogIdentity(`/questions/${questionId}`);

  if (!content) redirect(`/questions/${questionId}?error=${encodeURIComponent("Answer can't be empty.")}`);

  const supabase = await createClient();
  const { flagged, reason } = await checkAlarmingContent(content);

  await supabase.from("answers").insert({
    question_id: questionId,
    author_type: identity.authorType,
    author_id: identity.authorId,
    patient_author_id: identity.patientAuthorId,
    content,
    ai_flagged: flagged,
    ai_flag_reason: reason,
  });

  if (flagged) {
    await notifySuperAdminsOfFlag({
      message: `A new answer by ${identity.displayName} was flagged by AI review: ${reason || "no reason given"}`,
      link: `/questions/${questionId}`,
    });
  }

  const { data: question } = await supabase.from("questions").select("title, author_id, patient_author_id").eq("id", questionId).maybeSingle();
  const questionAuthorId = question?.author_id || question?.patient_author_id;
  if (questionAuthorId && questionAuthorId !== identity.userId) {
    await notifyFollowersOfNewContent(identity.userId, `${identity.displayName} answered a question you follow them on`, `/questions/${questionId}`);
  }

  revalidatePath(`/questions/${questionId}`);
}

export async function editAnswerAction(formData: FormData) {
  const answerId = String(formData.get("answer_id") || "");
  const questionId = String(formData.get("question_id") || "");
  const content = String(formData.get("content") || "").trim();
  await requireBlogIdentity(`/questions/${questionId}`);

  if (!content) redirect(`/questions/${questionId}?error=${encodeURIComponent("Answer can't be empty.")}`);

  const supabase = await createClient();
  // RLS (answers_update_own_or_admin) restricts this to the answer's own author.
  await supabase.from("answers").update({ content, updated_at: new Date().toISOString() }).eq("id", answerId);

  revalidatePath(`/questions/${questionId}`);
}

export async function deleteAnswerAction(formData: FormData) {
  const answerId = String(formData.get("answer_id") || "");
  const questionId = String(formData.get("question_id") || "");
  await requireBlogIdentity(`/questions/${questionId}`);

  const supabase = await createClient();
  // RLS (answers_delete_own_or_admin) allows the answer's own author OR a super_admin.
  await supabase.from("answers").delete().eq("id", answerId);

  revalidatePath(`/questions/${questionId}`);
}

export async function toggleQuestionLikeAction(formData: FormData) {
  const questionId = String(formData.get("question_id") || "");
  const identity = await requireBlogIdentity(`/questions/${questionId}`);
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("question_likes")
    .select("question_id")
    .eq("question_id", questionId)
    .eq("user_id", identity.userId)
    .maybeSingle();

  if (existing) {
    await supabase.from("question_likes").delete().eq("question_id", questionId).eq("user_id", identity.userId);
  } else {
    await supabase.from("question_likes").insert({ question_id: questionId, user_id: identity.userId });
  }

  revalidatePath(`/questions/${questionId}`);
}

export async function toggleQuestionUpvoteAction(formData: FormData) {
  const questionId = String(formData.get("question_id") || "");
  const identity = await requireBlogIdentity(`/questions/${questionId}`);
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("question_upvotes")
    .select("question_id")
    .eq("question_id", questionId)
    .eq("user_id", identity.userId)
    .maybeSingle();

  if (existing) {
    await supabase.from("question_upvotes").delete().eq("question_id", questionId).eq("user_id", identity.userId);
  } else {
    await supabase.from("question_upvotes").insert({ question_id: questionId, user_id: identity.userId });
  }

  revalidatePath(`/questions/${questionId}`);
  revalidatePath("/questions");
}

export async function toggleAnswerLikeAction(formData: FormData) {
  const answerId = String(formData.get("answer_id") || "");
  const questionId = String(formData.get("question_id") || "");
  const identity = await requireBlogIdentity(`/questions/${questionId}`);
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("answer_likes")
    .select("answer_id")
    .eq("answer_id", answerId)
    .eq("user_id", identity.userId)
    .maybeSingle();

  if (existing) {
    await supabase.from("answer_likes").delete().eq("answer_id", answerId).eq("user_id", identity.userId);
  } else {
    await supabase.from("answer_likes").insert({ answer_id: answerId, user_id: identity.userId });
  }

  revalidatePath(`/questions/${questionId}`);
}

export async function toggleAnswerUpvoteAction(formData: FormData) {
  const answerId = String(formData.get("answer_id") || "");
  const questionId = String(formData.get("question_id") || "");
  const identity = await requireBlogIdentity(`/questions/${questionId}`);
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("answer_upvotes")
    .select("answer_id")
    .eq("answer_id", answerId)
    .eq("user_id", identity.userId)
    .maybeSingle();

  if (existing) {
    await supabase.from("answer_upvotes").delete().eq("answer_id", answerId).eq("user_id", identity.userId);
  } else {
    await supabase.from("answer_upvotes").insert({ answer_id: answerId, user_id: identity.userId });
  }

  revalidatePath(`/questions/${questionId}`);
}
