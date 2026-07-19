import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSectionAccess } from "@/lib/permissions";
import { getProcedureByKey } from "@/lib/criteria-repo";
import type { RequestStatus } from "@/lib/database.types";
import { logAccess } from "@/lib/access-log";
import LetterPanel from "./LetterPanel";
import { approveLetterAction, redraftAction, updateStatusAction } from "./actions";
import TipsRotator from "@/app/dashboard/TipsRotator";

// redraftAction calls Claude via draftLetterForRequest, which can exceed the
// platform's 10s default serverless timeout.
export const maxDuration = 60;

const STATUS_FLOW: RequestStatus[] = ["draft", "reviewed", "submitted", "approved"];

export default async function RequestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  await requireSectionAccess("requests");
  const supabase = await createClient();

  const { data: request } = await supabase.from("pa_requests").select("*").eq("id", id).single();
  if (!request) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  await logAccess({ userId: user?.id || null, action: "view", resourceType: "pa_request", resourceId: id });

  const { data: letter } = await supabase
    .from("letters")
    .select("*")
    .eq("pa_request_id", id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const procedure = await getProcedureByKey(request.procedure_type);
  const isDenied = request.status === "denied";
  const currentStepIndex = isDenied ? -1 : STATUS_FLOW.indexOf(request.status as RequestStatus);

  return (
    <div className="max-w-[900px] mx-auto py-8 px-5">
      <Link href="/doctor/dashboard" className="text-[13px] text-gray-400 mb-3 inline-block">← Back to requests</Link>

      {error && (
        <div className="mb-5 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
          {error}
        </div>
      )}

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-semibold mb-1">{request.patient_reference}</h1>
          <p className="text-[14px] text-gray-600">
            {procedure?.label} · {request.payer.replace(/_/g, " ")} · ICD-10 {request.icd10_codes.join(", ") || "—"}
          </p>
        </div>
        <form action={redraftAction}>
          <input type="hidden" name="request_id" value={request.id} />
          <button className="btn btn-outline btn-sm" type="submit">Re-draft letter</button>
        </form>
      </div>

      <div className="card p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          {STATUS_FLOW.map((step, i) => (
            <StatusStep
              key={step}
              label={step}
              active={!isDenied && i <= currentStepIndex}
              isLast={i === STATUS_FLOW.length - 1}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          {(["draft", "reviewed", "submitted", "approved", "denied"] as RequestStatus[]).map((s) => (
            <form action={updateStatusAction} key={s}>
              <input type="hidden" name="request_id" value={request.id} />
              <input type="hidden" name="status" value={s} />
              <button
                className="btn btn-sm"
                type="submit"
                style={
                  request.status === s
                    ? { background: "var(--indigo-600)", color: "#fff" }
                    : { background: "var(--gray-100)", color: "var(--gray-600)" }
                }
              >
                Mark {s}
              </button>
            </form>
          ))}
        </div>
      </div>

      <TipsRotator className="mb-6" />

      {letter ? (
        <>
          <LetterPanel
            letterId={letter.id}
            requestId={request.id}
            content={letter.content}
            sections={letter.sections}
            meta={letter.meta}
            locked={!!letter.approved_at}
          />
          <div className="flex items-center gap-3 mt-4">
            <a className="btn btn-outline" href={`/api/letters/${letter.id}/pdf`} target="_blank" rel="noreferrer">
              Download PDF
            </a>
            {!letter.approved_at && (
              <form action={approveLetterAction}>
                <input type="hidden" name="letter_id" value={letter.id} />
                <input type="hidden" name="request_id" value={request.id} />
                <button className="btn btn-primary" type="submit">Approve &amp; lock →</button>
              </form>
            )}
            {letter.approved_at && (
              <span className="status-pill" style={{ background: "var(--success-bg)", color: "var(--success-green)" }}>
                Approved &amp; locked
              </span>
            )}
          </div>
        </>
      ) : (
        <div className="card p-6 text-center text-gray-400">Drafting letter…</div>
      )}

      {request.red_flags.length > 0 && (
        <div className="card p-5 mt-6">
          <h3 className="text-[13px] font-semibold text-gray-600 mb-2">Red flags reported</h3>
          <ul className="text-[13.5px] flex flex-col gap-1">
            {request.red_flags.map((f) => (
              <li key={f}>• {f}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatusStep({ label, active, isLast }: { label: string; active: boolean; isLast: boolean }) {
  return (
    <div className="flex items-center gap-2 flex-1">
      <div
        className="flex-1 h-[6px] rounded-full"
        style={{ background: active ? "var(--indigo-600)" : "var(--gray-100)" }}
      />
      <span className="text-[11px] capitalize font-medium" style={{ color: active ? "var(--indigo-600)" : "var(--gray-400)" }}>
        {label}
      </span>
      {!isLast && <span />}
    </div>
  );
}
