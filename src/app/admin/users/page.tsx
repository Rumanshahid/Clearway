import { changeRoleAction, getUsersWithProfiles, sendPasswordResetAction, toggleFlagAction } from "./actions";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const users = await getUsersWithProfiles(q);

  return (
    <div className="max-w-[1000px] mx-auto py-8 px-5">
      <h1 className="text-[24px] font-semibold mb-6">Users</h1>

      <form className="mb-5" method="get">
        <input className="input max-w-[320px]" type="search" name="q" placeholder="Search name, email, or practice" defaultValue={q} />
      </form>

      <div className="card overflow-hidden">
        <table className="w-full text-[13.5px]">
          <thead>
            <tr className="text-left text-gray-400 text-[11px] uppercase tracking-wide" style={{ borderBottom: "1px solid var(--gray-200)" }}>
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Email</th>
              <th className="px-5 py-3 font-semibold">Practice</th>
              <th className="px-5 py-3 font-semibold">Role</th>
              <th className="px-5 py-3 font-semibold">Flag</th>
              <th className="px-5 py-3 font-semibold">Reset password</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid var(--gray-200)" }}>
                <td className="px-5 py-3">{u.fullName || "—"}</td>
                <td className="px-5 py-3 text-gray-600">{u.email}</td>
                <td className="px-5 py-3 text-gray-400">{u.practiceName || "—"}</td>
                <td className="px-5 py-3">
                  <form action={changeRoleAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={u.id} />
                    <select className="input" name="role" defaultValue={u.role} style={{ padding: "4px 8px", fontSize: "12.5px" }}>
                      <option value="clinic_user">Clinic user</option>
                      <option value="clinic_admin">Clinic admin</option>
                      <option value="super_admin">Super admin</option>
                    </select>
                    <button className="text-indigo-600 text-[12px]" type="submit">Save</button>
                  </form>
                </td>
                <td className="px-5 py-3">
                  <form action={toggleFlagAction}>
                    <input type="hidden" name="id" value={u.id} />
                    <input type="hidden" name="flagged" value={String(u.flagged)} />
                    <button
                      type="submit"
                      className="status-pill"
                      style={
                        u.flagged
                          ? { background: "var(--danger-bg)", color: "var(--danger-red)" }
                          : { background: "var(--gray-100)", color: "var(--gray-600)" }
                      }
                    >
                      {u.flagged ? "Flagged" : "OK"}
                    </button>
                  </form>
                </td>
                <td className="px-5 py-3">
                  <form action={sendPasswordResetAction}>
                    <input type="hidden" name="email" value={u.email} />
                    <button className="text-indigo-600 text-[12.5px]" type="submit">Send reset link</button>
                  </form>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
