import { createClient } from "@/lib/supabase/server";

export interface TaskPreviewItem {
  id: string;
  title: string;
  due_date: string | null;
  due_time: string | null;
  isDoneByMe: boolean;
}

// Lightweight version of the tasks/page.tsx query, for the nav dropdown —
// just enough to show "what's outstanding" without the assignee/completion
// breakdown the full page needs. RLS (tasks_select) already scopes this to
// what the caller is allowed to see.
export async function getTaskPreview(userId: string, practiceId: string, limit = 6): Promise<TaskPreviewItem[]> {
  const supabase = await createClient();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, due_date, due_time")
    .eq("practice_id", practiceId)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  const taskIds = (tasks || []).map((t) => t.id);
  const { data: completions } = taskIds.length
    ? await supabase.from("task_completions").select("task_id").eq("user_id", userId).in("task_id", taskIds)
    : { data: [] as { task_id: string }[] };

  const doneIds = new Set((completions || []).map((c) => c.task_id));

  return (tasks || [])
    .map((t) => ({ id: t.id, title: t.title, due_date: t.due_date, due_time: t.due_time, isDoneByMe: doneIds.has(t.id) }))
    .filter((t) => !t.isDoneByMe)
    .slice(0, limit);
}
