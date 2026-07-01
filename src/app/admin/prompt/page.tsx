import { DEFAULT_PROMPT_TEMPLATE } from "@/lib/criteria";
import { getEnabledProcedures, listPromptTemplateVersions } from "@/lib/criteria-repo";
import PromptEditor from "./PromptEditor";
import { activateVersionAction } from "./actions";

export default async function AdminPromptPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [versions, procedures] = await Promise.all([listPromptTemplateVersions(), getEnabledProcedures()]);
  const active = versions.find((v) => v.is_active);

  return (
    <div className="max-w-[820px] mx-auto py-8 px-5">
      <h1 className="text-[24px] font-semibold mb-1">Letter prompt template</h1>
      <p className="text-[14px] text-gray-600 mb-6">
        This is the wrapper Claude sees around every procedure&apos;s criteria. Editing it changes every future
        letter generation across all practices.
      </p>

      {error && (
        <div className="mb-5 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
          {error}
        </div>
      )}

      <PromptEditor initialContent={active?.content || DEFAULT_PROMPT_TEMPLATE} procedures={procedures} />

      <section className="card p-6 mt-6">
        <h2 className="text-[15px] font-semibold mb-4">Version history</h2>
        <div className="flex flex-col gap-2">
          {versions.map((v) => (
            <div key={v.id} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid var(--gray-200)" }}>
              <div>
                <span className="text-[13.5px] font-medium">v{v.version}</span>
                <span className="text-[12px] text-gray-400 ml-2">{new Date(v.created_at).toLocaleString()}</span>
              </div>
              {v.is_active ? (
                <span className="status-pill" style={{ background: "var(--success-bg)", color: "var(--success-green)" }}>Active</span>
              ) : (
                <form action={activateVersionAction}>
                  <input type="hidden" name="id" value={v.id} />
                  <button className="btn btn-outline btn-sm" type="submit">Activate</button>
                </form>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
