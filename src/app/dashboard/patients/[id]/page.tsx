import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireSectionAccess } from "@/lib/permissions";
import { getProcedureLabelMap } from "@/lib/criteria-repo";
import PatientDetailClient from "./PatientDetailClient";
import EligibilityCard from "./EligibilityCard";
import PatientAccessCard, { type PatientProfileAccess } from "./PatientAccessCard";

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessionProfile = await requireSectionAccess("patients");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("practice_id")
    .eq("id", user!.id)
    .single();

  const { data: patient } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .single();

  if (!patient) notFound();

  // Patients who've also signed up for the self-service portal are matched
  // by email -- there's no FK between the practice-scoped `patients` table
  // and `patient_accounts`, so this is a best-effort lookup, not a guarantee.
  // Admin client: patient_accounts has no staff-facing RLS policy at all.
  let patientAccess: PatientProfileAccess | null = null;
  if (patient.email) {
    const admin = await createAdminClient();
    const { data: patientAccount } = await admin.from("patient_accounts").select("id").ilike("email", patient.email).maybeSingle();
    if (patientAccount) {
      const { data: accessRow } = await admin
        .from("patient_doctor_access")
        .select("access_granted, requested_at")
        .eq("patient_account_id", patientAccount.id)
        .eq("doctor_profile_id", sessionProfile.userId)
        .maybeSingle();

      const accessGranted = accessRow?.access_granted || false;
      const { data: patientProfileRow } = accessGranted
        ? await admin.from("patient_profiles").select("*").eq("patient_account_id", patientAccount.id).maybeSingle()
        : { data: null };

      patientAccess = {
        patientAccountId: patientAccount.id,
        patientId: id,
        accessGranted,
        requested: !!accessRow?.requested_at,
        profile: patientProfileRow,
      };
    }
  }

  const [{ data: physicians }, { data: usualPhysician }, { data: requests }, procedureLabels, { data: eligibilityChecks }] =
    await Promise.all([
      supabase
        .from("physicians")
        .select("id, name, credentials, npi, direct_phone, specialty, fax")
        .eq("practice_id", profile!.practice_id!)
        .order("name"),
      patient.usual_physician_id
        ? supabase.from("physicians").select("name").eq("id", patient.usual_physician_id).single()
        : Promise.resolve({ data: null }),
      supabase
        .from("pa_requests")
        .select("id, patient_reference, procedure_type, status, created_at")
        .eq("patient_id", id)
        .order("created_at", { ascending: false }),
      getProcedureLabelMap(),
      supabase
        .from("eligibility_checks")
        .select("id, checked_at, payer, member_id, plan_type, status, method, deductible_remaining, copay_amount, notes")
        .eq("patient_id", id)
        .order("checked_at", { ascending: false }),
    ]);

  const stats = {
    total: requests?.length ?? 0,
    approved: requests?.filter((r) => r.status === "approved").length ?? 0,
    denied: requests?.filter((r) => r.status === "denied").length ?? 0,
    open: requests?.filter((r) => r.status === "draft" || r.status === "reviewed" || r.status === "submitted").length ?? 0,
  };

  return (
    <div className="max-w-[900px] mx-auto py-8 px-5">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-[24px] font-semibold">{patient.first_name} {patient.last_name}</h1>
        <span className="text-[13px] text-gray-400">{patient.patient_ref_id}</span>
      </div>
      <p className="text-[13.5px] text-gray-600 mb-6">
        <Link href="/dashboard/patients" className="text-indigo-600">← Back to patients</Link>
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="PA Requests" value={stats.total} />
        <StatCard label="Approved" value={stats.approved} accent="var(--success-green)" />
        <StatCard label="Open" value={stats.open} accent="var(--indigo-600)" />
        <StatCard label="Denied" value={stats.denied} accent="var(--danger-red)" />
      </div>

      <PatientDetailClient
        patientId={patient.id}
        physicians={
          (physicians || []).map((p) => ({
            id: p.id,
            name: p.name,
            credentials: p.credentials,
            npi: p.npi,
            direct_phone: p.direct_phone,
            specialty: p.specialty,
            fax: p.fax,
          }))
        }
        physicianName={usualPhysician?.name || null}
        initial={{
          first_name: patient.first_name,
          middle_name: patient.middle_name || undefined,
          last_name: patient.last_name,
          dob: patient.dob,
          gender: patient.gender,
          status: patient.status,
          ssn_last4: patient.ssn_last4 || undefined,
          preferred_language: patient.preferred_language || undefined,
          address: patient.address || undefined,
          city: patient.city || undefined,
          state: patient.state || undefined,
          zip: patient.zip || undefined,
          phone: patient.phone || undefined,
          mobile_phone: patient.mobile_phone || undefined,
          email: patient.email || undefined,
          preferred_contact_method: patient.preferred_contact_method || undefined,
          best_time_to_call: patient.best_time_to_call || undefined,
          emergency_contact_name: patient.emergency_contact_name || undefined,
          emergency_contact_phone: patient.emergency_contact_phone || undefined,
          emergency_contact_relationship: patient.emergency_contact_relationship || undefined,
          insurance_company: patient.insurance_company || undefined,
          plan_type: patient.plan_type || undefined,
          state_of_plan: patient.state_of_plan || undefined,
          member_id: patient.member_id || undefined,
          group_number: patient.group_number || undefined,
          plan_name: patient.plan_name || undefined,
          effective_date: patient.effective_date || undefined,
          coverage_end_date: patient.coverage_end_date || undefined,
          insurance_phone: patient.insurance_phone || undefined,
          insurance_pa_fax: patient.insurance_pa_fax || undefined,
          has_secondary_insurance: patient.has_secondary_insurance,
          secondary_insurance_company: patient.secondary_insurance_company || undefined,
          secondary_plan_type: patient.secondary_plan_type || undefined,
          secondary_member_id: patient.secondary_member_id || undefined,
          secondary_group_number: patient.secondary_group_number || undefined,
          cob_order: patient.cob_order || undefined,
          usual_physician_id: patient.usual_physician_id || undefined,
          primary_diagnosis_icd10: patient.primary_diagnosis_icd10 || undefined,
          primary_diagnosis_description: patient.primary_diagnosis_description || undefined,
          known_drug_allergies: patient.known_drug_allergies || undefined,
          current_medications: patient.current_medications || undefined,
          consent_obtained: patient.consent_obtained,
          consent_date: patient.consent_date || undefined,
          consent_method: patient.consent_method || undefined,
          coordinator_notes: patient.coordinator_notes || undefined,
          preferred_letter_author_mode: patient.preferred_letter_author_mode || undefined,
          preferred_submission_method: patient.preferred_submission_method || undefined,
          special_handling_flags: patient.special_handling_flags,
          internal_tags: patient.internal_tags,
        }}
      />

      <div className="mt-6">
        <EligibilityCard
          patientId={patient.id}
          checks={eligibilityChecks || []}
          defaultPayer={patient.insurance_company}
          defaultMemberId={patient.member_id}
          defaultPlanType={patient.plan_type}
        />
      </div>

      {patientAccess && (
        <div className="mt-6">
          <PatientAccessCard access={patientAccess} />
        </div>
      )}

      <div className="card p-6 mt-6">
        <h2 className="text-[15px] font-semibold mb-4">PA request history</h2>
        {requests && requests.length > 0 ? (
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="text-left text-gray-400 text-[11px] uppercase tracking-wide" style={{ borderBottom: "1px solid var(--gray-200)" }}>
                <th className="py-2 font-semibold">Reference</th>
                <th className="py-2 font-semibold">Procedure</th>
                <th className="py-2 font-semibold">Status</th>
                <th className="py-2 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid var(--gray-100)" }}>
                  <td className="py-2">
                    <Link href={`/dashboard/requests/${r.id}`} className="text-indigo-600 font-medium">{r.patient_reference}</Link>
                  </td>
                  <td className="py-2 text-gray-600">{procedureLabels[r.procedure_type] || r.procedure_type}</td>
                  <td className="py-2 text-gray-600 capitalize">{r.status}</td>
                  <td className="py-2 text-gray-600">{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-400 text-[13.5px]">No PA requests filed for this patient yet.</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="card p-5">
      <div className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-2">{label}</div>
      <div className="text-[32px] font-light" style={accent ? { color: accent } : undefined}>{value}</div>
    </div>
  );
}
