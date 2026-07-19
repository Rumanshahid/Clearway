"use client";

import { useRouter } from "next/navigation";
import PatientPaStatusSelect from "./PatientPaStatusSelect";
import PatientPaRowActions from "./PatientPaRowActions";

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

  return (
    <tr
      className="hover:bg-gray-50 cursor-pointer transition-colors"
      style={{ borderBottom: "1px solid var(--gray-200)" }}
      onClick={() => router.push(`/patient/pa/${requestId}`)}
    >
      <td className="px-5 py-3">{doctorName}</td>
      <td className="px-5 py-3 max-w-[280px] truncate">{procedureDescription}</td>
      <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
        <PatientPaStatusSelect requestId={requestId} status={status} />
      </td>
      <td className="px-5 py-3 text-gray-400">{new Date(createdAt).toLocaleDateString()}</td>
      <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
        <PatientPaRowActions requestId={requestId} hasLetter={hasLetter} />
      </td>
    </tr>
  );
}
