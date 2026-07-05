"use client";

import { useRouter } from "next/navigation";
import PatientRowActions from "./PatientRowActions";

export default function PatientRow({
  patientId,
  patientRefId,
  name,
  dob,
  insuranceCompany,
  memberId,
  status,
}: {
  patientId: string;
  patientRefId: string;
  name: string;
  dob: string;
  insuranceCompany: string | null;
  memberId: string | null;
  status: string;
}) {
  const router = useRouter();

  return (
    <tr
      className="hover:bg-gray-50 cursor-pointer transition-colors"
      style={{ borderBottom: "1px solid var(--gray-100)" }}
      onClick={() => router.push(`/dashboard/patients/${patientId}`)}
    >
      <td className="px-5 py-3 text-indigo-600 font-medium">{patientRefId}</td>
      <td className="px-5 py-3">{name}</td>
      <td className="px-5 py-3 text-gray-600">{dob}</td>
      <td className="px-5 py-3 text-gray-600">{insuranceCompany || "—"}</td>
      <td className="px-5 py-3 text-gray-600">{memberId || "—"}</td>
      <td className="px-5 py-3 text-gray-600 capitalize">{status}</td>
      <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
        <PatientRowActions patientId={patientId} />
      </td>
    </tr>
  );
}
