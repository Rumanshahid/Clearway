import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionProfile } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import type { AppointmentStatus } from "@/lib/database.types";
import { markCompleteAction, markNoShowAction, cancelAppointmentAction, checkInAction, regenerateThankYouDraftAction, sendThankYouEmailAction } from "../actions";
import { mightNeedPriorAuth } from "@/lib/scheduling";

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  confirmed: "Confirmed",
  checked_in: "Checked In",
  complete: "Complete",
  no_show: "No-Show",
  cancelled: "Cancelled",
};

export default async function AppointmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSessionProfile();
  const supabase = await createClient();

  const { data: appointment } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", id)
    .eq("practice_id", session.practiceId)
    .single();
  if (!appointment) notFound();

  const [{ data: type }, { data: intakeQuestions }, { data: preVisitIntake }] = await Promise.all([
    supabase.from("appointment_types").select("name").eq("id", appointment.appointment_type_id).single(),
    supabase.from("intake_questions").select("question_key, question_text").eq("doctor_profile_id", appointment.doctor_profile_id),
    supabase.from("pre_appointment_intake").select("*").eq("appointment_id", appointment.id).maybeSingle(),
  ]);

  const questionTextByKey = new Map((intakeQuestions || []).filter((q) => q.question_key).map((q) => [q.question_key as string, q.question_text]));
  const intakeEntries = Object.entries(appointment.intake_answers || {});
  const flagPriorAuth = mightNeedPriorAuth(appointment.reason_for_visit);

  return (
    <div className="max-w-[760px] mx-auto py-8 px-5">
      <Link href="/dashboard/appointments" className="text-[13px] text-gray-500 mb-4 inline-block">← Back to appointments</Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-semibold">{appointment.patient_full_name}</h1>
        <span className="status-pill" style={{ background: "var(--gray-100)", color: "var(--gray-600)" }}>
          {STATUS_LABELS[appointment.status]}
        </span>
      </div>

      {flagPriorAuth && (
        <div className="card p-4 mb-4 flex items-center justify-between gap-3" style={{ borderColor: "var(--amber)", background: "var(--amber-bg)" }}>
          <p className="text-[13.5px]" style={{ color: "var(--amber)" }}>
            This visit&apos;s reason mentions something that may need prior authorization.
          </p>
          <Link href="/dashboard/requests/new" className="btn btn-outline btn-sm flex-shrink-0">Start a PA request →</Link>
        </div>
      )}

      {appointment.insurance_verification_status === "not_verified" && (
        <div className="card p-4 mb-4" style={{ borderColor: "var(--danger-red)", background: "var(--danger-bg)" }}>
          <p className="text-[13.5px]" style={{ color: "var(--danger-red)" }}>
            This patient&apos;s insurance may not be in-network — verify before the appointment.
          </p>
        </div>
      )}

      <div className="card p-5 mb-4 grid grid-cols-2 gap-4 text-[13.5px]">
        <div>
          <div className="text-gray-400 text-[11px] uppercase tracking-wide mb-1">Type</div>
          {type?.name || "—"}{appointment.is_telehealth ? " (Telehealth)" : ""}
        </div>
        <div>
          <div className="text-gray-400 text-[11px] uppercase tracking-wide mb-1">When</div>
          {new Date(appointment.start_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
        </div>
        <div>
          <div className="text-gray-400 text-[11px] uppercase tracking-wide mb-1">Phone</div>
          {appointment.patient_phone}
        </div>
        <div>
          <div className="text-gray-400 text-[11px] uppercase tracking-wide mb-1">Email</div>
          {appointment.patient_email}
        </div>
        {appointment.patient_dob && (
          <div>
            <div className="text-gray-400 text-[11px] uppercase tracking-wide mb-1">DOB</div>
            {appointment.patient_dob}
          </div>
        )}
        {appointment.patient_insurance_company && (
          <div>
            <div className="text-gray-400 text-[11px] uppercase tracking-wide mb-1">Insurance</div>
            {appointment.patient_insurance_company}{appointment.patient_member_id ? ` — ${appointment.patient_member_id}` : ""}
          </div>
        )}
      </div>

      {intakeEntries.length > 0 && (
        <div className="card p-5 mb-4">
          <div className="text-[13.5px] font-semibold mb-3">Intake answers</div>
          <div className="flex flex-col gap-2">
            {intakeEntries.map(([key, answer]) => (
              <div key={key} className="text-[13.5px]">
                <div className="text-gray-400 text-[12px]">{questionTextByKey.get(key) || key}</div>
                <div>{String(answer)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {preVisitIntake && (
        <div className="card p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[13.5px] font-semibold">Pre-visit intake form</div>
            <span className="text-[11px] text-gray-400">Submitted {new Date(preVisitIntake.submitted_at).toLocaleDateString()}</span>
          </div>
          <div className="flex flex-col gap-2 text-[13.5px]">
            {preVisitIntake.symptoms && (
              <div><span className="text-gray-400 text-[12px]">Symptoms</span><div>{preVisitIntake.symptoms}</div></div>
            )}
            {preVisitIntake.medical_history && (
              <div><span className="text-gray-400 text-[12px]">Medical history</span><div>{preVisitIntake.medical_history}</div></div>
            )}
            {preVisitIntake.current_medications && (
              <div><span className="text-gray-400 text-[12px]">Current medications</span><div>{preVisitIntake.current_medications}</div></div>
            )}
          </div>
        </div>
      )}

      {appointment.patient_notes && (
        <div className="card p-5 mb-4">
          <div className="text-[13.5px] font-semibold mb-2">Patient notes</div>
          <p className="text-[13.5px] text-gray-600">{appointment.patient_notes}</p>
        </div>
      )}

      {appointment.status === "complete" && (
        <div className="card p-5 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[13.5px] font-semibold">Thank-you email</div>
            {appointment.thank_you_sent_at && (
              <span className="status-pill" style={{ background: "var(--success-bg)", color: "var(--success-green)" }}>
                Sent {new Date(appointment.thank_you_sent_at).toLocaleDateString()}
              </span>
            )}
          </div>
          {appointment.thank_you_draft ? (
            <form action={sendThankYouEmailAction} className="flex flex-col gap-3">
              <input type="hidden" name="id" value={appointment.id} />
              <textarea className="input" name="body" rows={5} defaultValue={appointment.thank_you_draft} disabled={!!appointment.thank_you_sent_at} />
              {!appointment.thank_you_sent_at && (
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary btn-sm">Send to patient</button>
                  <button type="submit" formAction={regenerateThankYouDraftAction} className="btn btn-outline btn-sm">Regenerate</button>
                </div>
              )}
            </form>
          ) : (
            <form action={regenerateThankYouDraftAction}>
              <input type="hidden" name="id" value={appointment.id} />
              <button type="submit" className="btn btn-outline btn-sm">Generate draft</button>
            </form>
          )}
        </div>
      )}

      {(appointment.status === "confirmed" || appointment.status === "checked_in") && (
        <div className="flex gap-2">
          {appointment.status === "confirmed" && (
            <form action={checkInAction}>
              <input type="hidden" name="id" value={appointment.id} />
              <button type="submit" className="btn btn-outline btn-sm">Check In</button>
            </form>
          )}
          <form action={markCompleteAction}>
            <input type="hidden" name="id" value={appointment.id} />
            <button type="submit" className="btn btn-outline btn-sm">Mark Complete</button>
          </form>
          <form action={markNoShowAction}>
            <input type="hidden" name="id" value={appointment.id} />
            <button type="submit" className="btn btn-outline btn-sm">Mark No-Show</button>
          </form>
          <form action={cancelAppointmentAction}>
            <input type="hidden" name="id" value={appointment.id} />
            <button type="submit" className="btn btn-outline btn-sm">Cancel</button>
          </form>
        </div>
      )}
    </div>
  );
}
