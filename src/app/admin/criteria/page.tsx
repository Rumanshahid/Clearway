import Link from "next/link";
import { getAllProcedures } from "@/lib/criteria-repo";
import { toggleEnabledAction } from "./actions";

export default async function AdminCriteriaPage() {
  const procedures = await getAllProcedures();

  return (
    <div className="max-w-[900px] mx-auto py-8 px-5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-semibold mb-1">Payer criteria</h1>
          <p className="text-[14px] text-gray-600">
            Procedures shown to staff in the intake form. Toggle off to hide without deleting.
          </p>
        </div>
        <Link href="/admin/criteria/_new" className="btn btn-primary">+ Add procedure</Link>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-[13.5px]">
          <thead>
            <tr className="text-left text-gray-400 text-[11px] uppercase tracking-wide" style={{ borderBottom: "1px solid var(--gray-200)" }}>
              <th className="px-5 py-3 font-semibold">Procedure</th>
              <th className="px-5 py-3 font-semibold">Key</th>
              <th className="px-5 py-3 font-semibold">Required fields</th>
              <th className="px-5 py-3 font-semibold">Enabled</th>
              <th className="px-5 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {procedures.map((p) => (
              <tr key={p.id} style={{ borderBottom: "1px solid var(--gray-200)" }}>
                <td className="px-5 py-3 font-medium">{p.label}</td>
                <td className="px-5 py-3 text-gray-400 font-mono text-[12px]">{p.key}</td>
                <td className="px-5 py-3">{p.requiredFields.length}</td>
                <td className="px-5 py-3">
                  <form action={toggleEnabledAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="enabled" value={String(p.enabled)} />
                    <button
                      type="submit"
                      className="status-pill"
                      style={
                        p.enabled
                          ? { background: "var(--success-bg)", color: "var(--success-green)" }
                          : { background: "var(--gray-100)", color: "var(--gray-600)" }
                      }
                    >
                      {p.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </form>
                </td>
                <td className="px-5 py-3">
                  <Link href={`/admin/criteria/${p.key}`} className="text-indigo-600">Edit →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
