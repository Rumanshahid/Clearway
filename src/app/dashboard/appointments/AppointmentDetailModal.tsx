"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { mightNeedPriorAuth } from "@/lib/scheduling";
import {
  getAppointmentDetailAction,
  markCompleteAction,
  markNoShowAction,
  cancelAppointmentAction,
  checkInAction,
  regenerateThankYouDraftAction,
  sendThankYouEmailAction,
  type AppointmentDetail,
} from "./actions";

const STATUS_LABELS = {
  confirmed: "Confirmed",
  checked_in: "Checked In",
  complete: "Complete",
  no_show: "No-Show",
  cancelled: "Cancelled",
} as const;

// Same content the old standalone /dashboard/appointments/[id] page showed,
// now fetched on demand into a popup instead of navigating away from the
// list -- clicking View no longer loses your place (calendar selection,
// scroll position) in the list behind it.
export default function AppointmentDetailModal({ appointmentId, onClose }: { appointmentId: string | null; onClose: () => void }) {
  const [detail, setDetail] = useState<AppointmentDetail | null>(null);
  const [pending, setPending] = useState(false);

  // No separate "loading" state to set synchronously in the effect body --
  // derived instead from whether the currently-loaded detail (if any)
  // actually matches the id we're supposed to be showing.
  const loading = !!appointmentId && (!detail || detail.appointment.id !== appointmentId);

  useEffect(() => {
    if (!appointmentId) return;
    getAppointmentDetailAction(appointmentId).then((result) => {
      setDetail(result);
    });
  }, [appointmentId]);

  async function runAction(action: (formData: FormData) => Promise<void>, extra?: Record<string, string>) {
    if (!appointmentId) return;
    setPending(true);
    const formData = new FormData();
    formData.set("id", appointmentId);
    Object.entries(extra || {}).forEach(([k, v]) => formData.set(k, v));
    await action(formData);
    const refreshed = await getAppointmentDetailAction(appointmentId);
    setDetail(refreshed);
    setPending(false);
  }

  // detail isn't reset to null when switching ids (only ever set from the
  // fetch's own callback, to keep effect bodies free of direct setState
  // calls) -- guard on a matching id here instead, so a stale previous
  // appointment's content can't flash while the next one is loading.
  const showingCurrent = !loading && detail && detail.appointment.id === appointmentId;

  return (
    <Modal open={!!appointmentId} onClose={onClose} title={(showingCurrent && detail?.appointment.patient_full_name) || "Appointment"}>
      {loading && <p className="text-[13.5px] text-gray-400 text-center py-6">Loading…</p>}

      {showingCurrent && detail && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between -mt-2">
            <span className="status-pill" style={{ background: "var(--gray-100)", color: "var(--gray-600)" }}>
              {STATUS_LABELS[detail.appointment.status]}
            </span>
          </div>

          {mightNeedPriorAuth(detail.appointment.reason_for_visit) && (
            <div className="card p-4 text-[13.5px]" style={{ borderColor: "var(--amber)", background: "var(--amber-bg)", color: "var(--amber)" }}>
              This visit&apos;s reason mentions something that may need prior authorization.
            </div>
          )}

          {detail.appointment.insurance_verification_status === "not_verified" && (
            <div className="card p-4 text-[13.5px]" style={{ borderColor: "var(--danger-red)", background: "var(--danger-bg)", color: "var(--danger-red)" }}>
              This patient&apos;s insurance may not be in-network — verify before the appointment.
            </div>
          )}

          <div className="card p-4 grid grid-cols-2 gap-3 text-[13.5px]">
            <div>
              <div className="text-gray-400 text-[11px] uppercase tracking-wide mb-1">Type</div>
              {detail.typeName || "—"}{detail.appointment.is_telehealth ? " (Telehealth)" : ""}
            </div>
            <div>
              <div className="text-gray-400 text-[11px] uppercase tracking-wide mb-1">When</div>
              {new Date(detail.appointment.start_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
            </div>
            <div>
              <div className="text-gray-400 text-[11px] uppercase tracking-wide mb-1">Phone</div>
              {detail.appointment.patient_phone}
            </div>
            <div>
              <div className="text-gray-400 text-[11px] uppercase tracking-wide mb-1">Email</div>
              {detail.appointment.patient_email}
            </div>
            {detail.appointment.patient_dob && (
              <div>
                <div className="text-gray-400 text-[11px] uppercase tracking-wide mb-1">DOB</div>
                {detail.appointment.patient_dob}
              </div>
            )}
            {detail.appointment.patient_insurance_company && (
              <div>
                <div className="text-gray-400 text-[11px] uppercase tracking-wide mb-1">Insurance</div>
                {detail.appointment.patient_insurance_company}{detail.appointment.patient_member_id ? ` — ${detail.appointment.patient_member_id}` : ""}
              </div>
            )}
          </div>

          {Object.entries(detail.appointment.intake_answers || {}).length > 0 && (
            <div className="card p-4">
              <div className="text-[13.5px] font-semibold mb-3">Intake answers</div>
              <div className="flex flex-col gap-2">
                {Object.entries(detail.appointment.intake_answers as Record<string, unknown>).map(([key, answer]) => {
                  const question = detail.intakeQuestions.find((q) => q.question_key === key)?.question_text || key;
                  return (
                    <div key={key} className="text-[13.5px]">
                      <div className="text-gray-400 text-[12px]">{question}</div>
                      <div>{String(answer)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {detail.preVisitIntake && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[13.5px] font-semibold">Pre-visit intake form</div>
                <span className="text-[11px] text-gray-400">Submitted {new Date(detail.preVisitIntake.submitted_at).toLocaleDateString()}</span>
              </div>
              <div className="flex flex-col gap-2 text-[13.5px]">
                {detail.preVisitIntake.symptoms && (
                  <div><span className="text-gray-400 text-[12px]">Symptoms</span><div>{detail.preVisitIntake.symptoms}</div></div>
                )}
                {detail.preVisitIntake.medical_history && (
                  <div><span className="text-gray-400 text-[12px]">Medical history</span><div>{detail.preVisitIntake.medical_history}</div></div>
                )}
                {detail.preVisitIntake.current_medications && (
                  <div><span className="text-gray-400 text-[12px]">Current medications</span><div>{detail.preVisitIntake.current_medications}</div></div>
                )}
              </div>
            </div>
          )}

          {detail.appointment.patient_notes && (
            <div className="card p-4">
              <div className="text-[13.5px] font-semibold mb-2">Patient notes</div>
              <p className="text-[13.5px] text-gray-600">{detail.appointment.patient_notes}</p>
            </div>
          )}

          {detail.appointment.status === "complete" && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[13.5px] font-semibold">Thank-you email</div>
                {detail.appointment.thank_you_sent_at && (
                  <span className="status-pill" style={{ background: "var(--success-bg)", color: "var(--success-green)" }}>
                    Sent {new Date(detail.appointment.thank_you_sent_at).toLocaleDateString()}
                  </span>
                )}
              </div>
              {detail.appointment.thank_you_draft ? (
                <div className="flex flex-col gap-3">
                  <textarea
                    className="input"
                    rows={5}
                    defaultValue={detail.appointment.thank_you_draft}
                    disabled={!!detail.appointment.thank_you_sent_at}
                    onChange={(e) => setDetail({ ...detail, appointment: { ...detail.appointment, thank_you_draft: e.target.value } })}
                  />
                  {!detail.appointment.thank_you_sent_at && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={pending}
                        onClick={() => runAction(sendThankYouEmailAction, { body: detail.appointment.thank_you_draft || "" })}
                      >
                        Send to patient
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        disabled={pending}
                        onClick={() => runAction(regenerateThankYouDraftAction)}
                      >
                        Regenerate
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button type="button" className="btn btn-outline btn-sm" disabled={pending} onClick={() => runAction(regenerateThankYouDraftAction)}>
                  Generate draft
                </button>
              )}
            </div>
          )}

          {(detail.appointment.status === "confirmed" || detail.appointment.status === "checked_in") && (
            <div className="flex gap-2 flex-wrap">
              {detail.appointment.status === "confirmed" && (
                <button type="button" className="btn btn-outline btn-sm" disabled={pending} onClick={() => runAction(checkInAction)}>Check In</button>
              )}
              <button type="button" className="btn btn-outline btn-sm" disabled={pending} onClick={() => runAction(markCompleteAction)}>Mark Complete</button>
              <button type="button" className="btn btn-outline btn-sm" disabled={pending} onClick={() => runAction(markNoShowAction)}>Mark No-Show</button>
              <button type="button" className="btn btn-outline btn-sm" disabled={pending} onClick={() => runAction(cancelAppointmentAction)}>Cancel</button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
