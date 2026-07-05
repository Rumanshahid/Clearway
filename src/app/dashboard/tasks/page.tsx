import { getSessionProfile } from "@/lib/permissions";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { createTaskAction, deleteTaskAction } from "./actions";
import TaskStatusSelect from "./TaskStatusSelect";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await getSessionProfile();
  const supabase = await createClient();

  let query = supabase.from("tasks").select("*").eq("practice_id", session.practiceId);
  if (!session.isAdmin) {
    query = query.or(`assigned_to.eq.${session.userId},assigned_by.eq.${session.userId}`);
  }
  const { data: tasks } = await query.order("created_at", { ascending: false });

  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("practice_id", session.practiceId)
    .order("full_name");

  const admin = await createAdminClient();
  const { data: authList } = await admin.auth.admin.listUsers({ perPage: 200 });
  const emailById = new Map((authList?.users || []).map((u) => [u.id, u.email || ""]));
  const nameById = new Map((members || []).map((m) => [m.id, m.full_name || emailById.get(m.id) || "Unnamed"]));

  return (
    <div className="max-w-[900px] mx-auto py-8 px-5">
      <h1 className="text-[24px] font-semibold mb-1">Tasks</h1>
      <p className="text-[14px] text-gray-600 mb-6">
        {session.isAdmin ? "Assign work to anyone on your team, or track your own." : "Your to-do list — add your own, or see what's been assigned to you."}
      </p>

      {error && (
        <div className="mb-5 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
          {error}
        </div>
      )}

      <form action={createTaskAction} className="card p-6 mb-6 flex flex-col gap-4">
        <h2 className="text-[15px] font-semibold">New task</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label" htmlFor="title">Title <span style={{ color: "var(--danger-red)" }}>*</span></label>
            <input className="input" id="title" name="title" required />
          </div>
          <div className="col-span-2">
            <label className="label" htmlFor="description">Description</label>
            <textarea className="input" id="description" name="description" rows={2} />
          </div>
          {session.isAdmin && (
            <div>
              <label className="label" htmlFor="assigned_to">Assign to</label>
              <select className="input" id="assigned_to" name="assigned_to" defaultValue={session.userId}>
                {(members || []).map((m) => (
                  <option key={m.id} value={m.id}>{nameById.get(m.id)}{m.id === session.userId ? " (you)" : ""}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label" htmlFor="due_date">Due date</label>
            <input className="input" id="due_date" name="due_date" type="date" />
          </div>
        </div>
        <button className="btn btn-primary self-start" type="submit">Add task</button>
      </form>

      <div className="card overflow-hidden overflow-x-auto">
        <table className="w-full text-[13.5px]">
          <thead>
            <tr className="text-left text-gray-400 text-[11px] uppercase tracking-wide" style={{ borderBottom: "1px solid var(--gray-200)" }}>
              <th className="px-5 py-3 font-semibold">Task</th>
              <th className="px-5 py-3 font-semibold">Assigned to</th>
              <th className="px-5 py-3 font-semibold">Due</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {tasks && tasks.length > 0 ? (
              tasks.map((t) => (
                <tr key={t.id} style={{ borderBottom: "1px solid var(--gray-100)" }}>
                  <td className="px-5 py-3">
                    <div className="font-medium">{t.title}</div>
                    {t.description && <div className="text-[12px] text-gray-400">{t.description}</div>}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{nameById.get(t.assigned_to) || "Unknown"}</td>
                  <td className="px-5 py-3 text-gray-600">{t.due_date || "—"}</td>
                  <td className="px-5 py-3">
                    <TaskStatusSelect taskId={t.id} status={t.status} />
                  </td>
                  <td className="px-5 py-3">
                    <form action={deleteTaskAction}>
                      <input type="hidden" name="task_id" value={t.id} />
                      <button type="submit" className="text-btn text-[12.5px]" style={{ color: "var(--danger-red)" }}>
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-5 py-10 text-center text-gray-400" colSpan={5}>No tasks yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
