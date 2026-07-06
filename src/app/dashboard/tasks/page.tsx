import { getSessionProfile } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import TaskForm from "./TaskForm";
import TaskRow from "./TaskRow";
import TaskCalendar from "./TaskCalendar";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
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

  return (
    <div className="max-w-[900px] mx-auto py-8 px-5">
      <h1 className="text-[24px] font-semibold mb-1">Tasks</h1>
      <p className="text-[14px] text-gray-600 mb-6">
        {session.isAdmin
          ? "Assign work to anyone on your team, create team-wide tasks, or track your own."
          : "Your to-do list — add your own, or see what's been assigned to you or the team."}
      </p>

      {error && (
        <div className="mb-5 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
          {error}
        </div>
      )}

      <TaskCalendar
        todayIso={new Date().toISOString().slice(0, 10)}
        tasks={(tasks || []).map((t) => ({ id: t.id, title: t.title, due_date: t.due_date, due_time: t.due_time }))}
      />

      <TaskForm isAdmin={session.isAdmin} members={(members || []).filter((m) => m.id !== session.userId).map((m) => ({ id: m.id, name: nameById.get(m.id) || "Unnamed", avatarUrl: m.avatar_url }))} />

      <div className="flex flex-col gap-3">
        {tasks && tasks.length > 0 ? (
          tasks.map((t) => {
            const assignees = (assigneeRows || []).filter((a) => a.task_id === t.id).map((a) => toPerson(a.user_id));
            const completions = (completionRows || []).filter((c) => c.task_id === t.id);
            const completedBy = completions.map((c) => toPerson(c.user_id));
            const isDoneByMe = completions.some((c) => c.user_id === session.userId);
            const canManage = t.created_by === session.userId;
            const relevantAssignees = t.visibility === "assigned" ? assignees : t.visibility === "team" ? [] : [];
            return (
              <TaskRow
                key={t.id}
                task={t}
                canManage={canManage}
                assignees={relevantAssignees}
                completedBy={completedBy}
                isDoneByMe={isDoneByMe}
                showWhoCompleted={t.visibility !== "personal"}
              />
            );
          })
        ) : (
          <div className="card p-10 text-center text-gray-400 text-[13.5px]">No tasks yet.</div>
        )}
      </div>
    </div>
  );
}
