"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { notify } from "@/lib/notifications";

type Visibility = "personal" | "assigned" | "team";

export async function createTaskAction(formData: FormData) {
  const session = await getSessionProfile();
  const supabase = await createClient();

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const dueDate = String(formData.get("due_date") || "").trim();
  const dueTime = String(formData.get("due_time") || "").trim();
  const requestedVisibility = String(formData.get("visibility") || "personal") as Visibility;
  const assigneeIds = formData.getAll("assignees").map(String).filter(Boolean);

  if (!title) {
    redirect(`/dashboard/tasks?error=${encodeURIComponent("A title is required.")}`);
  }

  // Only an admin's form even renders visibility/assignee pickers, but the
  // picker being hidden isn't enforcement — re-check here, and the DB policy
  // (tasks_insert) backs this up regardless of what this action does.
  const visibility: Visibility = session.isAdmin ? requestedVisibility : "personal";
  if (visibility === "assigned" && assigneeIds.length === 0) {
    redirect(`/dashboard/tasks?error=${encodeURIComponent("Pick at least one teammate to assign this to.")}`);
  }

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      practice_id: session.practiceId,
      title,
      description: description || null,
      created_by: session.userId,
      visibility,
      due_date: dueDate || null,
      due_time: dueTime || null,
    })
    .select("id")
    .single();

  if (error || !task) {
    redirect(`/dashboard/tasks?error=${encodeURIComponent(error?.message || "Couldn't create the task.")}`);
  }

  const dueText = dueDate ? ` — due ${dueDate}${dueTime ? ` ${dueTime}` : ""}` : "";

  if (visibility === "assigned") {
    await supabase.from("task_assignees").insert(assigneeIds.map((id) => ({ task_id: task.id, user_id: id })));
    for (const id of assigneeIds) {
      await notify({ userId: id, type: "task_assigned", message: `You were assigned a task: "${title}"${dueText}`, link: "/dashboard/tasks" });
    }
  } else if (visibility === "team") {
    const { data: members } = await supabase.from("profiles").select("id").eq("practice_id", session.practiceId);
    for (const m of members || []) {
      if (m.id === session.userId) continue;
      await notify({ userId: m.id, type: "task_assigned", message: `New team task: "${title}"${dueText}`, link: "/dashboard/tasks" });
    }
  }

  revalidatePath("/dashboard/tasks");
}

export async function updateTaskAction(formData: FormData) {
  const session = await getSessionProfile();
  const supabase = await createClient();

  const taskId = String(formData.get("task_id") || "");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const dueDate = String(formData.get("due_date") || "").trim();
  const dueTime = String(formData.get("due_time") || "").trim();

  if (!title) {
    redirect(`/dashboard/tasks?error=${encodeURIComponent("A title is required.")}`);
  }

  const { data: task } = await supabase.from("tasks").select("created_by, practice_id").eq("id", taskId).single();
  if (!task || task.practice_id !== session.practiceId || task.created_by !== session.userId) {
    redirect(`/dashboard/tasks?error=${encodeURIComponent("Only the person who created a task can edit it.")}`);
  }

  await supabase
    .from("tasks")
    .update({ title, description: description || null, due_date: dueDate || null, due_time: dueTime || null, updated_at: new Date().toISOString() })
    .eq("id", taskId);

  revalidatePath("/dashboard/tasks");
}

export async function deleteTaskAction(formData: FormData) {
  const session = await getSessionProfile();
  const taskId = String(formData.get("task_id") || "");

  const supabase = await createClient();
  const { data: task } = await supabase.from("tasks").select("practice_id, created_by").eq("id", taskId).single();
  if (!task || task.practice_id !== session.practiceId) {
    redirect(`/dashboard/tasks?error=${encodeURIComponent("That task isn't in your practice.")}`);
  }
  if (task.created_by !== session.userId) {
    redirect(`/dashboard/tasks?error=${encodeURIComponent("Only the person who created a task can remove it.")}`);
  }

  await supabase.from("tasks").delete().eq("id", taskId);
  revalidatePath("/dashboard/tasks");
}

// Anyone who can see the task as an assignee/team member (or the personal
// owner) can mark their own completion — this never touches the task row
// itself, so it can't be used to edit or remove someone else's task.
export async function toggleTaskCompletionAction(formData: FormData) {
  const session = await getSessionProfile();
  const supabase = await createClient();

  const taskId = String(formData.get("task_id") || "");
  const done = String(formData.get("done") || "") === "true";

  if (done) {
    await supabase.from("task_completions").upsert({ task_id: taskId, user_id: session.userId });
  } else {
    await supabase.from("task_completions").delete().eq("task_id", taskId).eq("user_id", session.userId);
  }

  revalidatePath("/dashboard/tasks");
}
