"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PatientAppealStatusSelect from "./PatientAppealStatusSelect";
import PatientAppealRowActions from "./PatientAppealRowActions";
import { updatePatientAppealStatusAction } from "./actions";

export default function PatientAppealRequestRow({
  requestId,
  doctorName,
  denialReason,
  claimNumber,
  status,
  createdAt,
  hasLetter,
}: {
  requestId: string;
  doctorName: string;
  denialReason: string;
  claimNumber: string | null;
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
    updatePatientAppealStatusAction(formData);
  }

  return (
    <tr
      className="hover:bg-gray-50 cursor-pointer transition-colors"
      style={{ borderBottom: "1px solid var(--gray-200)" }}
      onClick={() => router.push(`/patient/appeals/${requestId}`)}
    >
      <td className="px-5 py-3 relative">
        <span
          aria-hidden="true"
          className="rounded-full absolute"
          style={{ width: 7, height: 7, left: 6, top: "50%", transform: "translateY(-50%)", background: value === "submitted" ? "#22c55e" : "var(--gray-400)" }}
        />
        {doctorName}
      </td>
      <td className="px-5 py-3 max-w-[240px] truncate">{denialReason}</td>
      <td className="px-5 py-3 text-gray-600">{claimNumber || "—"}</td>
      <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
        <PatientAppealStatusSelect value={value} onChange={handleStatusChange} />
      </td>
      <td className="px-5 py-3 text-gray-400">{new Date(createdAt).toLocaleDateString()}</td>
      <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
        <PatientAppealRowActions requestId={requestId} hasLetter={hasLetter} />
      </td>
    </tr>
  );
}
