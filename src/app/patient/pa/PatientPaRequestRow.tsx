"use client";

import { useRouter } from "next/navigation";

const STATUS_LABEL: Record<string, string> = {
  submitted: "Submitted",
  in_review: "In review",
  resolved: "Resolved",
};

export default function PatientPaRequestRow({
  requestId,
  doctorName,
  procedureDescription,
  status,
  createdAt,
}: {
  requestId: string;
  doctorName: string;
  procedureDescription: string;
  status: string;
  createdAt: string;
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
      <td className="px-5 py-3">
        <span className="status-pill" style={{ background: "var(--gray-100)", color: "var(--gray-600)" }}>
          {STATUS_LABEL[status] || status}
        </span>
      </td>
      <td className="px-5 py-3 text-gray-400">{new Date(createdAt).toLocaleDateString()}</td>
      <td className="px-5 py-3 text-gray-400">→</td>
    </tr>
  );
}
