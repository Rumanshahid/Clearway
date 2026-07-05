import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireSectionAccess } from "@/lib/permissions";
import PatientRow from "./PatientRow";

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ imported?: string; skipped?: string; errors?: string }>;
}) {
  const { imported, skipped, errors } = await searchParams;
  await requireSectionAccess("patients");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("practice_id")
    .eq("id", user!.id)
    .single();

  const { data: patients } = await supabase
    .from("patients")
    .select("id, patient_ref_id, first_name, last_name, dob, insurance_company, member_id, status")
    .eq("practice_id", profile!.practice_id!)
    .order("last_name");

  return (
    <div className="max-w-[1300px] mx-auto py-8 px-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-[20px] sm:text-[24px] font-semibold">Patients</h1>
        <Link href="/dashboard/patients/new" className="btn btn-primary self-start sm:self-auto">Add Patient →</Link>
      </div>

      {imported !== undefined && (
        <div
          className="mb-6 text-[13.5px] rounded-lg px-4 py-3"
          style={{ background: "var(--success-bg)", color: "var(--success-green)" }}
        >
          ✓ Imported {imported} patient{imported === "1" ? "" : "s"}.
          {skipped && Number(skipped) > 0 && ` ${skipped} row${skipped === "1" ? "" : "s"} skipped.`}
          {errors && (
            <ul className="list-disc pl-5 mt-1" style={{ color: "var(--danger-red)" }}>
              {errors.split(" | ").map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
      )}

      <div className="card overflow-hidden overflow-x-auto">
        <table className="w-full text-[13.5px]">
          <thead>
            <tr className="text-left text-gray-400 text-[11px] uppercase tracking-wide" style={{ borderBottom: "1px solid var(--gray-200)" }}>
              <th className="px-5 py-3 font-semibold">Ref ID</th>
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">DOB</th>
              <th className="px-5 py-3 font-semibold">Insurance</th>
              <th className="px-5 py-3 font-semibold">Member ID</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {patients && patients.length > 0 ? (
              patients.map((p) => (
                <PatientRow
                  key={p.id}
                  patientId={p.id}
                  patientRefId={p.patient_ref_id}
                  name={`${p.first_name} ${p.last_name}`}
                  dob={p.dob}
                  insuranceCompany={p.insurance_company}
                  memberId={p.member_id}
                  status={p.status}
                />
              ))
            ) : (
              <tr>
                <td className="px-5 py-10 text-center text-gray-400" colSpan={7}>
                  No patients yet. <Link href="/dashboard/patients/new" className="text-indigo-600">Add your first one →</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
