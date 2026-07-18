"use client";

import { useState } from "react";
import Link from "next/link";
import { routeAndGetSlotsAction, submitBookingAction, joinWaitlistAction, bookRecurringSeriesAction, type RoutingAndSlotsResult } from "./actions";
import type { SlotWindow } from "@/lib/scheduling";

type Step = "purpose" | "duration" | "location" | "routing" | "slots" | "waitlist" | "waitlisted" | "details" | "submitting" | "confirmed" | "error";

interface ChatEntry {
  role: "assistant" | "patient";
  text: string;
}

const DURATION_PRESETS = [30, 40, 60];

function buildIcs(doctorName: string, start: string, end: string): string {
  const fmt = (iso: string) => iso.replace(/[-:]/g, "").split(".")[0] + "Z";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:Appointment with ${doctorName}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export default function BookingClient({
  doctorSlug,
  doctorName,
  telehealthAvailable,
  backHref = "/doctors",
}: {
  doctorSlug: string;
  doctorName: string;
  telehealthAvailable: boolean;
  backHref?: string;
}) {
  const [step, setStep] = useState<Step>("purpose");
  const [chatLog, setChatLog] = useState<ChatEntry[]>([{ role: "assistant", text: "What's the purpose of your visit?" }]);
  const [purposeOfVisit, setPurposeOfVisit] = useState("");
  const [showCustomDuration, setShowCustomDuration] = useState(false);
  const [customDuration, setCustomDuration] = useState("");
  const [pendingDuration, setPendingDuration] = useState<number | null>(null);
  const [routing, setRouting] = useState<RoutingAndSlotsResult | null>(null);
  const [visibleSlotCount, setVisibleSlotCount] = useState(3);
  const [selectedSlot, setSelectedSlot] = useState<SlotWindow | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedAppointmentId, setConfirmedAppointmentId] = useState<string | null>(null);
  const [recurringSummary, setRecurringSummary] = useState<{ bookedCount: number; skippedDates: string[] } | null>(null);

  const [details, setDetails] = useState({
    patientFullName: "",
    patientDob: "",
    patientPhone: "",
    patientEmail: "",
    patientInsuranceCompany: "",
    patientMemberId: "",
    patientNotes: "",
    agreed: false,
    recurring: false,
    recurringWeeks: 4,
    recurringCount: 4,
  });

  function handlePurposeSubmit() {
    if (!purposeOfVisit.trim()) return;
    setChatLog((prev) => [
      ...prev,
      { role: "patient", text: purposeOfVisit.trim() },
      { role: "assistant", text: "How long would you like the appointment to be?" },
    ]);
    setStep("duration");
  }

  function handleDurationChosen(minutes: number) {
    setChatLog((prev) => [...prev, { role: "patient", text: `${minutes} minutes` }]);
    if (telehealthAvailable) {
      setChatLog((prev) => [...prev, { role: "assistant", text: "Would you like an on-call (telehealth) visit, or in person?" }]);
      setPendingDuration(minutes);
      setStep("location");
    } else {
      startRouting(purposeOfVisit.trim(), minutes, false);
    }
  }

  function handleLocationChosen(isTelehealth: boolean) {
    setChatLog((prev) => [...prev, { role: "patient", text: isTelehealth ? "On call (telehealth)" : "In person" }]);
    startRouting(purposeOfVisit.trim(), pendingDuration ?? 30, isTelehealth);
  }

  async function startRouting(reason: string, durationMinutes: number, isTelehealth: boolean) {
    setStep("routing");
    const result = await routeAndGetSlotsAction(doctorSlug, reason, durationMinutes, isTelehealth);
    if ("error" in result) {
      setErrorMessage("This doctor's profile couldn't be found.");
      setStep("error");
      return;
    }
    setRouting(result);
    setStep(result.slots.length > 0 ? "slots" : "waitlist");
  }

  async function handleJoinWaitlist() {
    if (!routing) return;
    const result = await joinWaitlistAction(doctorSlug, routing.appointmentTypeId, details.patientFullName, details.patientPhone, details.patientEmail);
    if (!result.ok) {
      setErrorMessage("Something went wrong — please try again.");
      setStep("error");
      return;
    }
    setStep("waitlisted");
  }

  async function handleConfirmBooking() {
    if (!routing || !selectedSlot) return;
    setStep("submitting");
    const result = await submitBookingAction({
      doctorSlug,
      appointmentTypeId: routing.appointmentTypeId,
      start: selectedSlot.start,
      end: selectedSlot.end,
      isTelehealth: routing.isTelehealth,
      reasonForVisit: routing.reasonForVisit,
      patientFullName: details.patientFullName,
      patientDob: details.patientDob,
      patientPhone: details.patientPhone,
      patientEmail: details.patientEmail,
      patientInsuranceCompany: details.patientInsuranceCompany,
      patientMemberId: details.patientMemberId,
      patientNotes: details.patientNotes,
    });

    if (!result.ok) {
      setErrorMessage(
        result.error === "slot_taken"
          ? "That time was just booked by someone else — please pick another."
          : "This doctor's profile couldn't be found."
      );
      setStep(result.error === "slot_taken" ? "slots" : "error");
      return;
    }

    setConfirmedAppointmentId(result.appointmentId);

    if (details.recurring && details.recurringCount > 1) {
      const seriesResult = await bookRecurringSeriesAction({
        doctorSlug,
        appointmentTypeId: routing.appointmentTypeId,
        firstStart: selectedSlot.start,
        intervalWeeks: details.recurringWeeks,
        totalOccurrences: details.recurringCount,
        durationMinutes: routing.durationMinutes,
        isTelehealth: routing.isTelehealth,
        patientFullName: details.patientFullName,
        patientPhone: details.patientPhone,
        patientEmail: details.patientEmail,
        patientDob: details.patientDob,
        patientInsuranceCompany: details.patientInsuranceCompany,
        patientMemberId: details.patientMemberId,
      });
      setRecurringSummary(seriesResult);
    }

    setStep("confirmed");
  }

  if (step === "error") {
    return (
      <div className="card p-6 text-center">
        <p style={{ fontSize: 14.5, color: "var(--gray-600)", marginBottom: 16 }}>{errorMessage}</p>
        <Link href={backHref} className="btn btn-outline">Back to directory</Link>
      </div>
    );
  }

  if (step === "confirmed" && routing && selectedSlot) {
    const icsData = `data:text/calendar;charset=utf-8,${encodeURIComponent(buildIcs(doctorName, selectedSlot.start, selectedSlot.end))}`;
    return (
      <div className="card p-6">
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>You&apos;re booked</h1>
        <p style={{ fontSize: 14.5, color: "var(--gray-600)", marginBottom: 4 }}>
          {routing.durationMinutes} min · {routing.isTelehealth ? "Telehealth" : "In person"} with {doctorName}
        </p>
        <p style={{ fontSize: 14.5, color: "var(--gray-900)", fontWeight: 600, marginBottom: 16 }}>
          {new Date(selectedSlot.start).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}
        </p>
        <p style={{ fontSize: 13, color: "var(--gray-600)", marginBottom: 16 }}>
          Bring your insurance card and photo ID. A confirmation has been sent to {details.patientEmail}.
        </p>
        <a href={icsData} download="appointment.ics" className="btn btn-outline btn-sm">Add to calendar</a>
        {recurringSummary && (
          <p style={{ fontSize: 13, color: "var(--gray-600)", marginTop: 16 }}>
            {recurringSummary.bookedCount} follow-up{recurringSummary.bookedCount === 1 ? "" : "s"} also booked.
            {recurringSummary.skippedDates.length > 0 &&
              ` A few dates (${recurringSummary.skippedDates.join(", ")}) weren't available — contact the office to reschedule those.`}
          </p>
        )}
        <p style={{ fontSize: 12, color: "var(--gray-400)", marginTop: 16 }}>Confirmation #{confirmedAppointmentId?.slice(0, 8)}</p>
      </div>
    );
  }

  if (step === "details" && routing && selectedSlot) {
    return (
      <div className="card p-6">
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Your details</h1>
        <p style={{ fontSize: 13.5, color: "var(--gray-600)", marginBottom: 20 }}>
          {routing.durationMinutes} min · {routing.isTelehealth ? "Telehealth" : "In person"} ·{" "}
          {new Date(selectedSlot.start).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
        </p>

        <div className="flex flex-col gap-3">
          <div>
            <label className="label">Full name</label>
            <input className="input" value={details.patientFullName} onChange={(e) => setDetails({ ...details, patientFullName: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" type="tel" value={details.patientPhone} onChange={(e) => setDetails({ ...details, patientPhone: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={details.patientEmail} onChange={(e) => setDetails({ ...details, patientEmail: e.target.value })} />
          </div>
          <div>
            <label className="label">Date of birth (optional)</label>
            <input className="input" type="date" value={details.patientDob} onChange={(e) => setDetails({ ...details, patientDob: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Insurance company (optional)</label>
              <input className="input" value={details.patientInsuranceCompany} onChange={(e) => setDetails({ ...details, patientInsuranceCompany: e.target.value })} />
            </div>
            <div>
              <label className="label">Member ID (optional)</label>
              <input className="input" value={details.patientMemberId} onChange={(e) => setDetails({ ...details, patientMemberId: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Notes for the doctor (optional)</label>
            <textarea className="input" rows={2} value={details.patientNotes} onChange={(e) => setDetails({ ...details, patientNotes: e.target.value })} />
          </div>
          <div className="card p-3" style={{ background: "var(--gray-50)" }}>
            <label className="flex items-center gap-2 text-[13px] mb-2">
              <input type="checkbox" className="w-4 h-4" checked={details.recurring} onChange={(e) => setDetails({ ...details, recurring: e.target.checked })} />
              Book follow-ups at regular intervals
            </label>
            {details.recurring && (
              <div className="flex items-center gap-2 text-[13px]">
                Every
                <select className="input w-auto" value={details.recurringWeeks} onChange={(e) => setDetails({ ...details, recurringWeeks: Number(e.target.value) })}>
                  <option value={1}>1 week</option>
                  <option value={2}>2 weeks</option>
                  <option value={4}>4 weeks</option>
                  <option value={6}>6 weeks</option>
                </select>
                for
                <select className="input w-auto" value={details.recurringCount} onChange={(e) => setDetails({ ...details, recurringCount: Number(e.target.value) })}>
                  {[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} visits</option>)}
                </select>
              </div>
            )}
          </div>
          <label className="flex items-start gap-2 text-[12.5px] text-gray-600">
            <input type="checkbox" className="w-4 h-4 mt-0.5" checked={details.agreed} onChange={(e) => setDetails({ ...details, agreed: e.target.checked })} />
            I confirm I am booking a real appointment and will show up or cancel in advance.
          </label>
          <button
            type="button"
            className="btn btn-primary self-start"
            disabled={!details.patientFullName || !details.patientPhone || !details.patientEmail || !details.agreed}
            onClick={handleConfirmBooking}
          >
            Confirm booking
          </button>
        </div>
      </div>
    );
  }

  if (step === "waitlisted") {
    return (
      <div className="card p-6 text-center">
        <p style={{ fontSize: 14.5, color: "var(--gray-600)" }}>
          You&apos;re on the waitlist. We&apos;ll email you the moment a spot opens up — you&apos;ll have 2 hours to confirm it.
        </p>
      </div>
    );
  }

  if (step === "waitlist" && routing) {
    return (
      <div className="card p-6">
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>No open times right now</h1>
        <p style={{ fontSize: 13.5, color: "var(--gray-600)", marginBottom: 20 }}>
          A {routing.durationMinutes}-minute {routing.isTelehealth ? "telehealth" : "in-person"} visit with {doctorName}{" "}
          has nothing open in the next 30 days. Join the waitlist and we&apos;ll email you if a spot opens up.
        </p>
        <div className="flex flex-col gap-3">
          <div>
            <label className="label">Full name</label>
            <input className="input" value={details.patientFullName} onChange={(e) => setDetails({ ...details, patientFullName: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" type="tel" value={details.patientPhone} onChange={(e) => setDetails({ ...details, patientPhone: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={details.patientEmail} onChange={(e) => setDetails({ ...details, patientEmail: e.target.value })} />
          </div>
          <button
            type="button"
            className="btn btn-primary self-start"
            disabled={!details.patientFullName || !details.patientPhone || !details.patientEmail}
            onClick={handleJoinWaitlist}
          >
            Join waitlist
          </button>
        </div>
      </div>
    );
  }

  if (step === "slots" && routing) {
    const visible = routing.slots.slice(0, visibleSlotCount);
    return (
      <div className="card p-6">
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Pick a time</h1>
        <p style={{ fontSize: 13.5, color: "var(--gray-600)", marginBottom: 20 }}>
          {routing.durationMinutes} min · {routing.isTelehealth ? "Telehealth" : "In person"} with {doctorName}
        </p>
        <div className="flex flex-col gap-2">
          {visible.map((slot) => (
            <button
              key={slot.start}
              type="button"
              className="btn btn-outline"
              style={{ justifyContent: "flex-start" }}
              onClick={() => {
                setSelectedSlot(slot);
                setStep("details");
              }}
            >
              {new Date(slot.start).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric" })} at{" "}
              {new Date(slot.start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </button>
          ))}
          {hasMoreSlots(routing, visibleSlotCount) && (
            <button type="button" className="text-btn text-[13px] text-gray-500 self-start" onClick={() => setVisibleSlotCount((n) => n + 5)}>
              None of these work — see more options
            </button>
          )}
        </div>
      </div>
    );
  }

  if (step === "routing" || step === "submitting") {
    return (
      <div className="card p-6 text-center">
        <p style={{ fontSize: 14, color: "var(--gray-600)" }}>
          {step === "routing" ? "Finding available times..." : "Confirming your booking..."}
        </p>
      </div>
    );
  }

  // step === "purpose" | "duration" | "location" -- the conversational intake
  return (
    <div className="card p-6">
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Book with {doctorName}</h1>
      <p style={{ fontSize: 13, color: "var(--gray-400)", marginBottom: 20 }}>A few quick questions first — about 30 seconds.</p>

      <div className="flex flex-col gap-3 mb-4">
        {chatLog.map((entry, i) => (
          <div
            key={i}
            style={{
              alignSelf: entry.role === "assistant" ? "flex-start" : "flex-end",
              background: entry.role === "assistant" ? "var(--gray-100)" : "#EEF0FF",
              color: entry.role === "assistant" ? "var(--gray-900)" : "var(--indigo-600)",
              borderRadius: 14,
              padding: "10px 14px",
              fontSize: 13.5,
              maxWidth: "80%",
            }}
          >
            {entry.text}
          </div>
        ))}
      </div>

      {step === "purpose" && (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handlePurposeSubmit();
          }}
        >
          <input className="input" value={purposeOfVisit} onChange={(e) => setPurposeOfVisit(e.target.value)} autoFocus />
          <button type="submit" className="btn btn-primary btn-sm">Send</button>
        </form>
      )}

      {step === "duration" && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 flex-wrap">
            {DURATION_PRESETS.map((minutes) => (
              <button key={minutes} type="button" className="btn btn-outline btn-sm" onClick={() => handleDurationChosen(minutes)}>
                {minutes} min
              </button>
            ))}
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowCustomDuration(true)}>
              Custom
            </button>
          </div>
          {showCustomDuration && (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const minutes = Number(customDuration);
                if (minutes >= 5) handleDurationChosen(minutes);
              }}
            >
              <input
                className="input w-32"
                type="number"
                min={5}
                placeholder="Minutes"
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn btn-primary btn-sm">Use this</button>
            </form>
          )}
        </div>
      )}

      {step === "location" && (
        <div className="flex gap-2 flex-wrap">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => handleLocationChosen(true)}>
            On call (telehealth)
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => handleLocationChosen(false)}>
            In person
          </button>
        </div>
      )}
    </div>
  );
}

function hasMoreSlots(routing: RoutingAndSlotsResult, visibleSlotCount: number): boolean {
  return routing.slots.length > visibleSlotCount;
}
