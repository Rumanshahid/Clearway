"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PatientPaStatusSelect from "./PatientPaStatusSelect";
import PatientPaRowActions from "./PatientPaRowActions";
import { updatePatientPaStatusAction } from "./actions";

export default function PatientPaRequestRow({
  requestId,
  doctorName,
  procedureDescription,
  status,
  createdAt,
  hasLetter,
}: {
  requestId: string;
  doctorName: string;
  procedureDescription: string;
  status: string;
  createdAt: string;
  hasLetter: boolean;
}) {
  const router = useRouter();

  const [prevStatus, setPrevStatus] = useState(status);
  const [value, setValue] = useState<"draft" | "submitted">(status === "submitted" ? "submitted" : "draft");
  if (status !== prevStatus) {
    setPrevStatus(status);
    setValue(status === "submitted" ? "submitted" : "draft");
  }

  function handleStatusChange(next: "draft" | "submitted") {
    setValue(next);
    const formData = new FormData();
    formData.set("request_id", requestId);
    formData.set("status", next);
    updatePatientPaStatusAction(formData);
  }

  return (
    <tr
      className="hover:bg-gray-50 cursor-pointer transition-colors"
      style={{ borderBottom: "1px solid var(--gray-200)" }}
      onClick={() => router.push(`/patient/pa/${requestId}`)}
    >
      <td className="px-5 py-3">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="rounded-full flex-shrink-0"
            style={{ width: 7, height: 7, background: value === "submitted" ? "#22c55e" : "var(--gray-400)" }}
          />
          {doctorName}
        </div>
      </td>
      <td className="px-5 py-3 max-w-[280px] truncate">{procedureDescription}</td>
      <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
        <PatientPaStatusSelect value={value} onChange={handleStatusChange} />
      </td>
      <td className="px-5 py-3 text-gray-400">{new Date(createdAt).toLocaleDateString()}</td>
      <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
        <PatientPaRowActions requestId={requestId} hasLetter={hasLetter} />
      </td>
    </tr>
  );
}
