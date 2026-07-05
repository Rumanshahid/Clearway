import { createClient } from "@/lib/supabase/server";
import { PAYERS } from "@/lib/criteria";
import { getAllPayerToggles, getEnabledProcedures } from "@/lib/criteria-repo";
import type { AuthoringMode } from "@/lib/database.types";
import NewRequestForm from "./NewRequestForm";
import TipsRotator from "@/app/dashboard/TipsRotator";

// Letter generation regularly takes longer than the platform's 10s default
// serverless timeout; this raises it to the max allowed on a Vercel Hobby
// plan for the Server Action this page's form submits to. Bump alongside
// any plan upgrade.
export const maxDuration = 60;

export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; procedure_type?: string }>;
}) {
  const { error, procedure_type } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("practice_id")
    .eq("id", user!.id)
    .single();
  const { data: practice } = await supabase
    .from("practices")
    .select("default_authoring_mode")
    .eq("id", profile!.practice_id!)
    .single();

  const [procedures, payerToggles, { data: physicians }, { data: patients }] = await Promise.all([
    getEnabledProcedures(),
    getAllPayerToggles(),
    supabase
      .from("physicians")
      .select("id, name, credentials, npi, direct_phone, specialty, fax")
      .eq("practice_id", profile!.practice_id!)
      .order("name"),
    supabase
      .from("patients")
      .select("id, patient_ref_id, first_name, middle_name, last_name, dob, address, city, state, zip, phone, member_id, group_number, plan_type")
      .eq("practice_id", profile!.practice_id!)
      .order("last_name"),
  ]);

  const patientIds = (patients || []).map((p) => p.id);
  const { data: eligibilityChecks } = patientIds.length
    ? await supabase
        .from("eligibility_checks")
        .select("patient_id, status, checked_at")
        .in("patient_id", patientIds)
        .order("checked_at", { ascending: false })
    : { data: [] as { patient_id: string; status: string; checked_at: string }[] };

  const latestEligibilityByPatient = new Map<string, { status: string; checked_at: string }>();
  for (const check of eligibilityChecks || []) {
    if (!latestEligibilityByPatient.has(check.patient_id)) {
      latestEligibilityByPatient.set(check.patient_id, { status: check.status, checked_at: check.checked_at });
    }
  }

  const patientsWithEligibility = (patients || []).map((p) => ({
    ...p,
    latest_eligibility_status: latestEligibilityByPatient.get(p.id)?.status || null,
    latest_eligibility_checked_at: latestEligibilityByPatient.get(p.id)?.checked_at || null,
  }));

  return (
    <div className="max-w-[760px] mx-auto py-8 px-5">
      <h1 className="text-[24px] font-semibold mb-1">New prior authorization request</h1>
      <p className="text-[14px] text-gray-600 mb-6">
        Under three minutes to fill in. Your letter is drafted automatically from what you enter here.
      </p>

      {error && (
        <div className="mb-5 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
          {error}
        </div>
      )}

      <TipsRotator className="mb-6" />

      {procedures.length === 0 ? (
        <div className="card p-6 text-center text-gray-400">
          No procedures are enabled yet. Ask a super admin to enable at least one under Admin → Criteria.
        </div>
      ) : (
        <NewRequestForm
          procedures={procedures}
          payers={PAYERS}
          payerToggles={payerToggles}
          initialProcedure={procedure_type}
          defaultAuthoringMode={(practice?.default_authoring_mode || "doctor") as AuthoringMode}
          savedPhysicians={physicians || []}
          savedPatients={patientsWithEligibility}
        />
      )}
    </div>
  );
}
