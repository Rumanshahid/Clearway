import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import LetterCard from "../../LetterCard";
import PatientAppealStatusSelect from "../PatientAppealStatusSelect";
import { redraftPatientAppealLetterAction, editPatientAppealLetterAction } from "../actions";

// redraft calls Claude, which can run close to the platform's 10s default
// serverless timeout.
export const maxDuration = 60;

export default async function PatientAppealRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const admin = await createAdminClient();
  const { data: request } = await admin
    .from("patient_appeal_requests")
    .select("id, doctor_profile_id, claim_number, date_of_service, denial_reason, notes, status, created_at, letter_content, risk_flags, suggestions")
    .eq("id", id)
    .eq("patient_account_id", user.id)
    .maybeSingle();
  if (!request) notFound();

  const { data: doctorProfile } = await admin.from("profiles").select("full_name").eq("id", request.doctor_profile_id).maybeSingle();

  return (
    <div className="max-w-[700px] mx-auto py-8 px-5">
      <Link href="/patient/appeals" className="text-[13px] text-gray-400 mb-3 inline-block">← Back to appeals</Link>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[20px] font-semibold mb-1">{doctorProfile?.full_name || "Doctor"}</h1>
          <p className="text-[13.5px] text-gray-600">
            {request.denial_reason}
            {request.claim_number ? ` · Claim #${request.claim_number}` : ""} · {new Date(request.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex-shrink-0">
          <PatientAppealStatusSelect requestId={request.id} status={request.status} />
        </div>
      </div>

      {request.notes && (
        <div className="card p-4 mb-6">
          <div className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-1">Additional notes</div>
          <p className="text-[13.5px] text-gray-700 whitespace-pre-wrap">{request.notes}</p>
        </div>
      )}

      <div className="card p-5">
        <h2 className="text-[15px] font-semibold mb-1">Letter</h2>
        <LetterCard
          requestId={request.id}
          letterContent={request.letter_content}
          riskFlags={request.risk_flags}
          suggestions={request.suggestions}
          draftAction={redraftPatientAppealLetterAction}
          editAction={editPatientAppealLetterAction}
        />
      </div>
    </div>
  );
}
