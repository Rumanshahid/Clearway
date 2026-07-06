import { getSessionProfile } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import TasksBoard from "./TasksBoard";
import type { TaskRowData } from "./TaskRow";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; openAdd?: string }>;
}) {
  const { error, openAdd } = await searchParams;
  const session = await getSessionProfile();
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .eq("practice_id", session.practiceId)
    .order("full_name");

  const nameById = new Map((members || []).map((m) => [m.id, m.full_name || "Unnamed"]));
  const avatarById = new Map((members || []).map((m) => [m.id, m.avatar_url]));

  // RLS (tasks_select) already limits this to: everything you created,
  // everything marked 'team', and anything you're specifically assigned —
  // a doctor never sees a staff member's personal tasks, and staff never
  // see each other's personal tasks.
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("practice_id", session.practiceId)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  const taskIds = (tasks || []).map((t) => t.id);

  const { data: assigneeRows } = taskIds.length
    ? await supabase.from("task_assignees").select("task_id, user_id").in("task_id", taskIds)
    : { data: [] as { task_id: string; user_id: string }[] };

  const { data: completionRows } = taskIds.length
    ? await supabase.from("task_completions").select("task_id, user_id").in("task_id", taskIds)
    : { data: [] as { task_id: string; user_id: string }[] };

  const toPerson = (id: string) => ({ id, name: nameById.get(id) || "Unknown", avatarUrl: avatarById.get(id) || null });

  const rows: TaskRowData[] = (tasks || []).map((t) => {
    const assignees = (assigneeRows || []).filter((a) => a.task_id === t.id).map((a) => toPerson(a.user_id));
    const completions = (completionRows || []).filter((c) => c.task_id === t.id);
    const completedBy = completions.map((c) => toPerson(c.user_id));
    const isDoneByMe = completions.some((c) => c.user_id === session.userId);
    const canManage = t.created_by === session.userId;
    return {
      task: t,
      canManage,
      assignees: t.visibility === "assigned" ? assignees : [],
      completedBy,
      isDoneByMe,
      showWhoCompleted: t.visibility !== "personal",
    };
  });

  return (
    <div className="max-w-[1200px] mx-auto py-8 px-5">
      {error && (
        <div className="mb-5 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
          {error}
        </div>
      )}

      <TasksBoard
        isAdmin={session.isAdmin}
        subtitle={
          session.isAdmin
            ? "Assign work to anyone on your team, create team-wide tasks, or track your own."
            : "Your to-do list — add your own, or see what's been assigned to you or the team."
        }
        members={(members || []).filter((m) => m.id !== session.userId).map((m) => ({ id: m.id, name: nameById.get(m.id) || "Unnamed", avatarUrl: m.avatar_url }))}
        todayIso={new Date().toISOString().slice(0, 10)}
        rows={rows}
        openAddInitially={openAdd === "1"}
      />
    </div>
  );
}
