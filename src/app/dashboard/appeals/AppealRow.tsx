"use client";

import { useRouter } from "next/navigation";
import AppealRowActions from "./AppealRowActions";

export default function AppealRow({
  denialId,
  claimNumber,
  denialReasonCode,
  payer,
  amountDenied,
  appealDeadline,
  priority,
  status,
  letterId,
}: {
  denialId: string;
  claimNumber: string | null;
  denialReasonCode: string;
  payer: string | null;
  amountDenied: number | null;
  appealDeadline: string | null;
  priority: string;
  status: string;
  letterId?: string;
}) {
  const router = useRouter();

  return (
    <tr
      className="hover:bg-gray-50 cursor-pointer transition-colors"
      style={{ borderBottom: "1px solid var(--gray-100)" }}
      onClick={() => router.push(`/dashboard/appeals/${denialId}`)}
    >
      <td className="px-5 py-3 text-indigo-600 font-medium">{claimNumber || "(none)"}</td>
      <td className="px-5 py-3 text-gray-600">{denialReasonCode}</td>
      <td className="px-5 py-3 text-gray-600">{payer || "—"}</td>
      <td className="px-5 py-3 text-gray-600">{amountDenied != null ? `$${amountDenied.toLocaleString()}` : "—"}</td>
      <td className="px-5 py-3 text-gray-600">{appealDeadline || "—"}</td>
      <td className="px-5 py-3 text-gray-600">{priority}</td>
      <td className="px-5 py-3 text-gray-600 capitalize">{status.replace("_", " ")}</td>
      <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
        <AppealRowActions denialId={denialId} letterId={letterId} />
      </td>
    </tr>
  );
}
