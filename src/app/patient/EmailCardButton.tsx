"use client";

import { useState, useTransition } from "react";
import { emailPatientCardAction } from "./actions";

export default function EmailCardButton() {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");

  function handleClick() {
    startTransition(async () => {
      const result = await emailPatientCardAction();
      setStatus(result.error ? "error" : "sent");
    });
  }

  return (
    <div>
      <button type="button" className="btn btn-outline" onClick={handleClick} disabled={pending}>
        {pending ? "Sending…" : "Email me my card"}
      </button>
      {status === "sent" && <p className="text-[12.5px] mt-1.5" style={{ color: "var(--success-green)" }}>Sent — check your inbox.</p>}
      {status === "error" && <p className="text-[12.5px] mt-1.5" style={{ color: "var(--danger-red)" }}>Couldn&apos;t send that — try again.</p>}
    </div>
  );
}
