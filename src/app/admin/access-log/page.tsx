import { createClient, createAdminClient } from "@/lib/supabase/server";

export default async function AdminAccessLogPage() {
  const supabase = await createClient();
  const admin = await createAdminClient();

  const { data: logs } = await supabase
    .from("access_log")
    .select("id, user_id, action, resource_type, resource_id, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const userIds = Array.from(new Set((logs || []).map((l) => l.user_id).filter((id): id is string => !!id)));
  const emailById = new Map<string, string>();
  await Promise.all(
    userIds.map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id);
      if (data.user?.email) emailById.set(id, data.user.email);
    })
  );

  return (
    <div className="max-w-[1000px] mx-auto py-8 px-5">
      <h1 className="text-[24px] font-semibold mb-1">Access log</h1>
      <p className="text-[14px] text-gray-600 mb-6">
        Last 100 events. Every view, download, creation, approval, and status change on PA requests and letters
        is recorded here with a timestamp and user ID, and is never purged by the retention policy.
      </p>

      <div className="card overflow-hidden">
        <table className="w-full text-[13.5px]">
          <thead>
            <tr className="text-left text-gray-400 text-[11px] uppercase tracking-wide" style={{ borderBottom: "1px solid var(--gray-200)" }}>
              <th className="px-5 py-3 font-semibold">User</th>
              <th className="px-5 py-3 font-semibold">Action</th>
              <th className="px-5 py-3 font-semibold">Resource</th>
              <th className="px-5 py-3 font-semibold">When</th>
            </tr>
          </thead>
          <tbody>
            {(logs || []).map((log) => (
              <tr key={log.id} style={{ borderBottom: "1px solid var(--gray-200)" }}>
                <td className="px-5 py-3">{(log.user_id && emailById.get(log.user_id)) || "system"}</td>
                <td className="px-5 py-3 capitalize">{log.action.replace("_", " ")}</td>
                <td className="px-5 py-3 text-gray-400 font-mono text-[12px]">
                  {log.resource_type}:{log.resource_id?.slice(0, 8)}
                </td>
                <td className="px-5 py-3 text-gray-400">{new Date(log.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {(!logs || logs.length === 0) && (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-400">No access events logged yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
