"use client";

import { useState } from "react";
import { updatePatientPaStatusAction } from "./actions";

const OPTIONS: { value: "draft" | "submitted"; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
];

// Controlled, not a plain <form action={...}> select with defaultValue --
// React resets uncontrolled fields in a form back to their defaultValue
// right after a server action submission completes, which snapped this
// select back to the old status until a full page reload. Tracking the
// value in state and calling the action directly avoids that reset.
export default function PatientPaStatusSelect({ requestId, status }: { requestId: string; status: string }) {
  const [prevStatus, setPrevStatus] = useState(status);
  const [value, setValue] = useState<"draft" | "submitted">(status === "submitted" ? "submitted" : "draft");
  if (status !== prevStatus) {
    setPrevStatus(status);
    setValue(status === "submitted" ? "submitted" : "draft");
  }

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as "draft" | "submitted";
    setValue(next);
    const formData = new FormData();
    formData.set("request_id", requestId);
    formData.set("status", next);
    updatePatientPaStatusAction(formData);
  }

  return (
    <div className="flex items-center gap-2">
      <select
        className="input"
        value={value}
        onChange={handleChange}
        style={{ padding: "5px 8px", fontSize: "12.5px", width: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <span
        aria-hidden="true"
        className="rounded-full flex-shrink-0"
        style={{ width: 7, height: 7, background: value === "submitted" ? "#22c55e" : "var(--gray-400)" }}
      />
    </div>
  );
}
