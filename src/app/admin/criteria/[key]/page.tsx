import Link from "next/link";
import { PAYERS, PayerKey } from "@/lib/criteria";
import { getPayerTogglesForProcedure, getProcedureByKey } from "@/lib/criteria-repo";
import { createClient } from "@/lib/supabase/server";
import CriteriaEditor from "./CriteriaEditor";
import { togglePayerAction } from "../actions";

export default async function EditCriteriaPage({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { key } = await params;
  const { error } = await searchParams;
  const isNew = key === "_new";

  const procedure = isNew ? null : await getProcedureByKey(key);
  const toggles: Partial<Record<PayerKey, boolean>> = isNew ? {} : await getPayerTogglesForProcedure(key);

  let id: string | undefined;
  let enabled = true;
  if (!isNew) {
    const supabase = await createClient();
    const { data } = await supabase.from("criteria").select("id, enabled").eq("key", key).maybeSingle();
    id = data?.id;
    enabled = data?.enabled ?? true;
  }

  return (
    <div className="max-w-[760px] mx-auto py-8 px-5">
      <Link href="/admin/criteria" className="text-[13px] text-gray-400 mb-3 inline-block">← Back to criteria</Link>
      <h1 className="text-[24px] font-semibold mb-6">{isNew ? "New procedure" : procedure?.label}</h1>

      {error && (
        <div className="mb-5 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
          {error}
        </div>
      )}

      {!isNew && (
        <section className="card p-6 mb-6">
          <h2 className="text-[15px] font-semibold mb-4">Payer coverage for this procedure</h2>
          <div className="flex flex-col gap-2">
            {PAYERS.map((payer) => {
              const payerEnabled = toggles[payer.key] !== false;
              return (
                <form action={togglePayerAction} key={payer.key} className="flex items-center justify-between">
                  <span className="text-[13.5px]">{payer.label}</span>
                  <input type="hidden" name="procedure_key" value={key} />
                  <input type="hidden" name="payer_key" value={payer.key} />
                  <input type="hidden" name="enabled" value={String(payerEnabled)} />
                  <button
                    type="submit"
                    className="status-pill"
                    style={
                      payerEnabled
                        ? { background: "var(--success-bg)", color: "var(--success-green)" }
                        : { background: "var(--gray-100)", color: "var(--gray-600)" }
                    }
                  >
                    {payerEnabled ? "Shown" : "Hidden"}
                  </button>
                </form>
              );
            })}
          </div>
        </section>
      )}

      <CriteriaEditor
        id={id}
        initialKey={procedure?.key || ""}
        initialLabel={procedure?.label || ""}
        initialRequiredFields={procedure?.requiredFields || []}
        initialRedFlags={procedure?.redFlags || []}
        initialAetna={procedure?.aetna || ""}
        initialEvicore={procedure?.evicore || ""}
        initialSources={procedure?.sources || ""}
        initialPromptNotes={procedure?.promptNotes || ""}
        initialEnabled={enabled}
      />
    </div>
  );
}
