"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { estimateAppealDeadline } from "@/lib/claims";
import { generateClaimAppealLetter } from "@/lib/claims-anthropic";

export async function createDenialAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase.from("profiles").select("practice_id").eq("id", user.id).single();
  if (!profile?.practice_id) redirect("/onboarding");

  const str = (key: string) => String(formData.get(key) || "").trim();
  const num = (key: string) => {
    const v = str(key);
    return v ? Number(v) : null;
  };

  let patientId = str("patient_id");
  const denialDate = str("denial_date");
  const denialReasonCode = str("denial_reason_code");
  const payer = str("payer");

  if (!patientId) {
    const firstName = str("new_patient_first_name");
    const lastName = str("new_patient_last_name");
    const dob = str("new_patient_dob");
    const gender = str("new_patient_gender");

    if (!firstName || !lastName || !dob || !gender) {
      redirect(`/dashboard/appeals/new?error=${encodeURIComponent("Select an existing patient or fill in the new patient's name, DOB, and gender.")}`);
      return;
    }

    const { data: newPatient, error: patientError } = await supabase
      .from("patients")
      .insert({ practice_id: profile.practice_id, first_name: firstName, last_name: lastName, dob, gender })
      .select("id")
      .single();

    if (patientError || !newPatient) {
      redirect(`/dashboard/appeals/new?error=${encodeURIComponent(patientError?.message || "Could not save the new patient.")}`);
      return;
    }
    patientId = newPatient.id;
  }

  if (!denialDate || !denialReasonCode) {
    redirect(`/dashboard/appeals/new?error=${encodeURIComponent("Denial date and denial reason code are required.")}`);
    return;
  }

  const { data: denial, error: insertError } = await supabase
    .from("claim_denials")
    .insert({
      practice_id: profile.practice_id,
      created_by: user.id,
      patient_id: patientId,
      assigned_to: str("assigned_to") || null,
      pa_request_id: str("pa_request_id") || null,
      date_of_service: str("date_of_service") || null,
      cpt_code: str("cpt_code") || null,
      icd10_code: str("icd10_code") || null,
      claim_number: str("claim_number") || null,
      amount_billed: num("amount_billed"),
      amount_denied: num("amount_denied"),
      date_submitted: str("date_submitted") || null,
      denial_date: denialDate,
      denial_reason_code: denialReasonCode,
      denial_reason_description: str("denial_reason_description") || null,
      payer: payer || null,
      payer_claim_reference: str("payer_claim_reference") || null,
      pa_obtained: str("pa_obtained") || null,
      appeal_deadline: estimateAppealDeadline(denialDate, payer),
      appeal_type: str("appeal_type") || null,
      priority: str("priority") || "Standard",
      new_clinical_evidence: str("new_clinical_evidence") || null,
      supporting_documentation: str("supporting_documentation") || null,
      p2p_requested: formData.get("p2p_requested") === "on",
      filing_method: str("filing_method") || null,
      status: "open",
    })
    .select("id")
    .single();

  if (insertError || !denial) {
    redirect(`/dashboard/appeals/new?error=${encodeURIComponent(insertError?.message || "Could not save this denial.")}`);
    return;
  }

  try {
    await draftClaimAppealLetter(denial.id);
  } catch (err) {
    console.error("draftClaimAppealLetter failed", err);
    redirect(
      `/dashboard/appeals/${denial.id}?error=${encodeURIComponent(
        `The denial was saved, but drafting the appeal letter failed: ${err instanceof Error ? err.message : "unknown error"}. Try Re-draft below.`
      )}`
    );
  }

  redirect(`/dashboard/appeals/${denial.id}`);
}

export async function draftClaimAppealLetter(denialId: string) {
  const supabase = await createClient();

  const { data: denial } = await supabase.from("claim_denials").select("*").eq("id", denialId).single();
  if (!denial) throw new Error("Claim denial not found");

  const { data: patient } = denial.patient_id
    ? await supabase.from("patients").select("*").eq("id", denial.patient_id).single()
    : { data: null };

  let physician: { name: string; credentials: string | null; npi: string | null; direct_phone: string | null } | null = null;

  if (denial.pa_request_id) {
    const { data: request } = await supabase
      .from("pa_requests")
      .select("ordering_physician_name, ordering_physician_credentials, ordering_physician_npi, ordering_physician_direct_phone")
      .eq("id", denial.pa_request_id)
      .single();
    if (request) {
      physician = {
        name: request.ordering_physician_name,
        credentials: request.ordering_physician_credentials,
        npi: request.ordering_physician_npi,
        direct_phone: request.ordering_physician_direct_phone,
      };
    }
  } else if (patient?.usual_physician_id) {
    const { data: p } = await supabase
      .from("physicians")
      .select("name, credentials, npi, direct_phone")
      .eq("id", patient.usual_physician_id)
      .single();
    if (p) physician = p;
  }

  const result = await generateClaimAppealLetter({
    denialReasonCode: denial.denial_reason_code,
    denialReasonDescription: denial.denial_reason_description ?? undefined,
    payer: denial.payer ?? undefined,
    claimNumber: denial.claim_number ?? undefined,
    payerClaimReference: denial.payer_claim_reference ?? undefined,
    dateOfService: denial.date_of_service ?? undefined,
    cptCode: denial.cpt_code ?? undefined,
    icd10Code: denial.icd10_code ?? undefined,
    amountBilled: denial.amount_billed ?? undefined,
    amountDenied: denial.amount_denied ?? undefined,
    patientReference: patient?.patient_ref_id,
    patientFullName: patient ? [patient.first_name, patient.middle_name, patient.last_name].filter(Boolean).join(" ") : undefined,
    patientDob: patient?.dob,
    memberId: patient?.member_id ?? undefined,
    groupNumber: patient?.group_number ?? undefined,
    paObtained: denial.pa_obtained ?? undefined,
    newClinicalEvidence: denial.new_clinical_evidence ?? undefined,
    supportingDocumentation: denial.supporting_documentation ?? undefined,
    p2pRequested: denial.p2p_requested,
    filingMethod: denial.filing_method ?? undefined,
    orderingPhysicianName: physician?.name,
    orderingPhysicianCredentials: physician?.credentials ?? undefined,
    orderingPhysicianNpi: physician?.npi ?? undefined,
    orderingPhysicianDirectPhone: physician?.direct_phone ?? undefined,
  });

  const { data: lastVersion } = await supabase
    .from("claim_appeal_letters")
    .select("version")
    .eq("claim_denial_id", denialId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase.from("claim_appeal_letters").insert({
    claim_denial_id: denialId,
    content: result.plainText,
    sections: result.sections,
    meta: result.meta,
    version: (lastVersion?.version || 0) + 1,
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
  });
}
