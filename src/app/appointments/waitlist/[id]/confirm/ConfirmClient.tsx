"use client";

import { useState } from "react";
import { confirmWaitlistOfferAction } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  not_found: "This offer link isn't valid.",
  expired: "This offer has expired and was passed to the next person on the waitlist.",
  slot_taken: "That time was just taken by someone else — please contact the office to check for other openings.",
  already_used: "This offer has already been confirmed.",
};

export default function ConfirmClient({ waitlistId }: { waitlistId: string }) {
  const [state, setState] = useState<"idle" | "confirming" | "confirmed" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleConfirm() {
    setState("confirming");
    const result = await confirmWaitlistOfferAction(waitlistId);
    if (!result.ok) {
      setErrorMessage(ERROR_MESSAGES[result.error] || "Something went wrong.");
      setState("error");
      return;
    }
    setState("confirmed");
  }

  if (state === "confirmed") {
    return <p style={{ fontSize: 14.5, color: "var(--gray-600)" }}>You&apos;re booked — check your email for the confirmation.</p>;
  }

  if (state === "error") {
    return <p style={{ fontSize: 14.5, color: "var(--gray-600)" }}>{errorMessage}</p>;
  }

  return (
    <div className="card p-6 text-center">
      <p style={{ fontSize: 14.5, color: "var(--gray-600)", marginBottom: 20 }}>Click below to confirm this appointment time before it&apos;s offered to someone else.</p>
      <button type="button" className="btn btn-primary" disabled={state === "confirming"} onClick={handleConfirm}>
        {state === "confirming" ? "Confirming..." : "Confirm this time"}
      </button>
    </div>
  );
}
