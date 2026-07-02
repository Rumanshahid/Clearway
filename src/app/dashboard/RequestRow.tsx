"use client";

import { useRouter } from "next/navigation";
import type { RequestStatus } from "@/lib/database.types";
import StatusSelect from "./StatusSelect";
import RowActions from "./RowActions";

export default function RequestRow({
  requestId,
  patientReference,
  procedureLabel,
  payer,
  status,
  createdAt,
  letterId,
}: {
  requestId: string;
  patientReference: string;
  procedureLabel: string;
  payer: string;
  status: RequestStatus;
  createdAt: string;
  letterId?: string;
}) {
  const router = useRouter();

  return (
    <tr
      className="hover:bg-gray-50 cursor-pointer transition-colors"
      style={{ borderBottom: "1px solid var(--gray-200)" }}
      onClick={() => router.push(`/dashboard/requests/${requestId}`)}
    >
      <td className="px-5 py-3">{patientReference}</td>
      <td className="px-5 py-3">{procedureLabel}</td>
      <td className="px-5 py-3 capitalize">{payer.replace(/_/g, " ")}</td>
      <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
        <StatusSelect requestId={requestId} status={status} />
      </td>
      <td className="px-5 py-3 text-gray-400">{new Date(createdAt).toLocaleDateString()}</td>
      <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
        <RowActions requestId={requestId} letterId={letterId} />
      </td>
    </tr>
  );
}
