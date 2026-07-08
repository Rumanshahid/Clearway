"use client";

import { useState } from "react";
import { patientCancelAction, getRescheduleSlotsAction, patientRescheduleAction } from "./actions";
import type { SlotWindow } from "@/lib/scheduling";

type View = "summary" | "cancel-confirm" | "cancelled" | "reschedule-slots" | "reschedule-confirm" | "rescheduled" | "error";

export default function ManageClient({
  appointmentId,
  doctorName,
  appointmentTypeName,
  start,
  status,
}: {
  appointmentId: string;
  doctorName: string;
  appointmentTypeName: string;
  start: string;
  status: string;
}) {
  const [view, setView] = useState<View>("summary");
  const [slots, setSlots] = useState<SlotWindow[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const canManage = status === "confirmed" || status === "checked_in";

  async function handleCancel() {
    const formData = new FormData();
    formData.set("id", appointmentId);
    const result = await patientCancelAction(formData);
    if (!result.ok) {
      setErrorMessage("Something went wrong — please contact the office directly.");
      setView("error");
      return;
    }
    setView("cancelled");
  }

  async function handleStartReschedule() {
    const openSlots = await getRescheduleSlotsAction(appointmentId);
    setSlots(openSlots);
    setView("reschedule-slots");
  }

  async function handlePickSlot(slot: SlotWindow) {
    const result = await patientRescheduleAction(appointmentId, slot.start, slot.end);
    if (!result.ok) {
      setErrorMessage(result.error === "slot_taken" ? "That time was just taken — please pick another." : "Something went wrong — please contact the office directly.");
      setView(result.error === "slot_taken" ? "reschedule-slots" : "error");
      return;
    }
    setView("rescheduled");
  }

  if (view === "error") {
    return <p style={{ fontSize: 14, color: "var(--gray-600)" }}>{errorMessage}</p>;
  }

  if (view === "cancelled") {
    return <p style={{ fontSize: 14, color: "var(--gray-600)" }}>Your appointment has been cancelled. We hope to see you again soon.</p>;
  }

  if (view === "rescheduled") {
    return <p style={{ fontSize: 14, color: "var(--gray-600)" }}>Your appointment has been rescheduled — check your email for the new confirmation.</p>;
  }

  if (view === "reschedule-slots") {
    return (
      <div className="flex flex-col gap-2">
        <p style={{ fontSize: 13.5, color: "var(--gray-600)", marginBottom: 4 }}>Pick a new time:</p>
        {slots.length === 0 && <p style={{ fontSize: 13.5, color: "var(--gray-400)" }}>No open times in the next 30 days.</p>}
        {slots.slice(0, 8).map((slot) => (
          <button key={slot.start} type="button" className="btn btn-outline" style={{ justifyContent: "flex-start" }} onClick={() => handlePickSlot(slot)}>
            {new Date(slot.start).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric" })} at{" "}
            {new Date(slot.start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{appointmentTypeName} with {doctorName}</h1>
      <p style={{ fontSize: 14.5, color: "var(--gray-600)", marginBottom: 20 }}>
        {new Date(start).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}
      </p>

      {canManage ? (
        view === "cancel-confirm" ? (
          <div className="flex flex-col gap-3">
            <p style={{ fontSize: 13.5, color: "var(--gray-600)" }}>Are you sure you want to cancel this appointment?</p>
            <div className="flex gap-2">
              <button type="button" className="btn btn-primary btn-sm" onClick={handleCancel}>Yes, cancel it</button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setView("summary")}>Never mind</button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button type="button" className="btn btn-outline" onClick={handleStartReschedule}>Reschedule</button>
            <button type="button" className="btn btn-outline" onClick={() => setView("cancel-confirm")}>Cancel appointment</button>
          </div>
        )
      ) : (
        <p style={{ fontSize: 13.5, color: "var(--gray-400)" }}>This appointment can no longer be changed here.</p>
      )}
    </div>
  );
}
