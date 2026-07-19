"use client";

import { useState } from "react";
import PatientPaStatusSelect from "./PatientPaStatusSelect";
import { updatePatientPaStatusAction } from "./actions";

// Standalone version of the status select for the detail page (no dot --
// that's rendered inline in the list row next to the doctor name instead).
export default function PatientPaStatusControl({ requestId, status }: { requestId: string; status: string }) {
  const [prevStatus, setPrevStatus] = useState(status);
  const [value, setValue] = useState<"draft" | "submitted">(status === "submitted" ? "submitted" : "draft");
  if (status !== prevStatus) {
    setPrevStatus(status);
    setValue(status === "submitted" ? "submitted" : "draft");
  }

  function handleChange(next: "draft" | "submitted") {
    setValue(next);
    const formData = new FormData();
    formData.set("request_id", requestId);
    formData.set("status", next);
    updatePatientPaStatusAction(formData);
  }

  return <PatientPaStatusSelect value={value} onChange={handleChange} />;
}
