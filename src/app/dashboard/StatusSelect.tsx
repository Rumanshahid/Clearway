"use client";

import type { RequestStatus } from "@/lib/database.types";
import { updateStatusAction } from "./requests/[id]/actions";

const OPTIONS: { value: RequestStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "reviewed", label: "Reviewed" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "denied", label: "Denied" },
];

export default function StatusSelect({ requestId, status }: { requestId: string; status: RequestStatus }) {
  return (
    <form
      action={updateStatusAction}
      onChange={(e) => (e.currentTarget as HTMLFormElement).requestSubmit()}
    >
      <input type="hidden" name="request_id" value={requestId} />
      <select
        className="input"
        name="status"
        defaultValue={status}
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
