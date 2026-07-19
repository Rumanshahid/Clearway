"use client";

import { updatePatientAppealStatusAction } from "./actions";

const OPTIONS: { value: "draft" | "submitted"; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
];

export default function PatientAppealStatusSelect({ requestId, status }: { requestId: string; status: string }) {
  return (
    <form action={updatePatientAppealStatusAction} onChange={(e) => (e.currentTarget as HTMLFormElement).requestSubmit()}>
      <input type="hidden" name="request_id" value={requestId} />
      <select
        className="input"
        name="status"
        defaultValue={status === "submitted" ? "submitted" : "draft"}
        style={{ padding: "5px 8px", fontSize: "12.5px", width: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </form>
  );
}
