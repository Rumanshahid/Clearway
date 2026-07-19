"use client";

import { useRouter } from "next/navigation";
import PatientAppealStatusSelect from "./PatientAppealStatusSelect";
import PatientAppealRowActions from "./PatientAppealRowActions";

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

  return (
    <tr
      className="hover:bg-gray-50 cursor-pointer transition-colors"
      style={{ borderBottom: "1px solid var(--gray-200)" }}
      onClick={() => router.push(`/patient/appeals/${requestId}`)}
    >
      <td className="px-5 py-3">{doctorName}</td>
      <td className="px-5 py-3 max-w-[240px] truncate">{denialReason}</td>
      <td className="px-5 py-3 text-gray-600">{claimNumber || "—"}</td>
      <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
        <PatientAppealStatusSelect requestId={requestId} status={status} />
      </td>
      <td className="px-5 py-3 text-gray-400">{new Date(createdAt).toLocaleDateString()}</td>
      <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
        <PatientAppealRowActions requestId={requestId} hasLetter={hasLetter} />
      </td>
    </tr>
  );
}
