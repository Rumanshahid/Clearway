"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export async function createTaskAction(formData: FormData) {
  const session = await getSessionProfile();

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const dueDate = String(formData.get("due_date") || "").trim();
  const assignedToRaw = String(formData.get("assigned_to") || "").trim();

  if (!title) {
    redirect(`/dashboard/tasks?error=${encodeURIComponent("A title is required.")}`);
    return;
  }

  // Staff can only create tasks for themselves — only an admin's form even
  // renders the assignee picker, but this is re-checked here since the
  // picker being hidden in the UI isn't enforcement.
  const assignedTo = session.isAdmin && assignedToRaw ? assignedToRaw : session.userId;

  const supabase = await createClient();
  await supabase.from("tasks").insert({
    practice_id: session.practiceId,
    title,
    description: description || null,
    due_date: dueDate || null,
    assigned_to: assignedTo,
    assigned_by: session.userId,
    status: "pending",
  });

  revalidatePath("/dashboard/tasks");
}

export async function updateTaskStatusAction(formData: FormData) {
  const session = await getSessionProfile();
  const taskId = String(formData.get("task_id") || "");
  const status = String(formData.get("status") || "pending");

  const supabase = await createClient();
  const { data: task } = await supabase.from("tasks").select("practice_id").eq("id", taskId).single();
  if (!task || task.practice_id !== session.practiceId) {
    redirect(`/dashboard/tasks?error=${encodeURIComponent("That task isn't in your practice.")}`);
    return;
  }

  await supabase.from("tasks").update({ status, updated_at: new Date().toISOString() }).eq("id", taskId);
  revalidatePath("/dashboard/tasks");
}

export async function deleteTaskAction(formData: FormData) {
  const session = await getSessionProfile();
  const taskId = String(formData.get("task_id") || "");

  const supabase = await createClient();
  const { data: task } = await supabase.from("tasks").select("practice_id, assigned_by, assigned_to").eq("id", taskId).single();
  if (!task || task.practice_id !== session.practiceId) {
    redirect(`/dashboard/tasks?error=${encodeURIComponent("That task isn't in your practice.")}`);
    return;
  }
  if (!session.isAdmin && task.assigned_by !== session.userId && task.assigned_to !== session.userId) {
    redirect(`/dashboard/tasks?error=${encodeURIComponent("You can only delete tasks you created or were assigned.")}`);
    return;
  }

  await supabase.from("tasks").delete().eq("id", taskId);
  revalidatePath("/dashboard/tasks");
}
