"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateLetter } from "@/lib/anthropic";
import { getMissingRequiredFields, PayerKey, DEFAULT_PROMPT_TEMPLATE } from "@/lib/criteria";
import type { AuthoringMode } from "@/lib/database.types";
import { getActivePromptTemplate, getProcedureByKey } from "@/lib/criteria-repo";
import { logAccess } from "@/lib/access-log";
import { notifyLetterReady, notifyUsageThreshold } from "./notify";

// Best-effort split for the quick "save this patient" shortcut in the New
// Request form, which only collects one combined name field — a real
// first/last/gender breakdown is entered properly from the Patients tab;
// this just avoids losing the name entirely when staff save from here.
function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  return { firstName: parts[0] || fullName, lastName: parts.slice(1).join(" ") || parts[0] || fullName };
}

export async function createRequestAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("practice_id")
    .eq("id", user.id)
    .single();

  if (!profile?.practice_id) redirect("/onboarding");

  const { data: practice } = await supabase
    .from("practices")
    .select("plan, letters_included, letters_used_this_period, billing_status")
    .eq("id", profile.practice_id)
    .single();

  if (practice?.billing_status === "suspended") {
    redirect(`/dashboard/billing?error=${encodeURIComponent("Your account is suspended. Update billing to resume.")}`);
  }

  if (practice && practice.letters_used_this_period >= practice.letters_included) {
    redirect(
      `/dashboard/billing?error=${encodeURIComponent(
        `You've used all ${practice.letters_included} letters on the ${practice.plan} plan. Upgrade to keep drafting.`
      )}`
    );
  }

  const procedureType = String(formData.get("procedure_type") || "");
  const procedure = await getProcedureByKey(procedureType);
  if (!procedure) {
    redirect(`/dashboard/requests/new?error=${encodeURIComponent("Select a procedure type.")}`);
    return;
  }

  const caseFields: Record<string, string> = {};
  for (const field of procedure.requiredFields) {
    caseFields[field.key] = String(formData.get(field.key) || "").trim();
  }

  const missing = getMissingRequiredFields(procedure, caseFields);
  if (missing.length > 0) {
    const params = new URLSearchParams();
    params.set("procedure_type", procedureType);
    params.set(
      "error",
      `Missing required fields before this letter can be drafted: ${missing.map((f) => f.label).join(", ")}`
    );
    redirect(`/dashboard/requests/new?${params.toString()}`);
  }

  const patientReference = String(formData.get("patient_reference") || "").trim();
  const payer = String(formData.get("payer") || "") as PayerKey;
  const icd10Codes = String(formData.get("icd10_codes") || "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  const memberId = String(formData.get("member_id") || "").trim();
  const cptCode = String(formData.get("cpt_code") || "").trim();
  const authoringMode = String(formData.get("authoring_mode") || "doctor") as AuthoringMode;
  const orderingPhysicianName = String(formData.get("ordering_physician_name") || "").trim();
  const orderingPhysicianCredentials = String(formData.get("ordering_physician_credentials") || "").trim();
  const intendedUse = String(formData.get("intended_use") || caseFields.intended_use || "").trim();
  const redFlags = formData.getAll("red_flags").map(String);

  const patientFullName = String(formData.get("patient_full_name") || "").trim();
  const patientDob = String(formData.get("patient_dob") || "").trim();
  const patientAddress = String(formData.get("patient_address") || "").trim();
  const patientCityStateZip = String(formData.get("patient_city_state_zip") || "").trim();
  const patientPhone = String(formData.get("patient_phone") || "").trim();
  const insuranceGroupNumber = String(formData.get("insurance_group_number") || "").trim();
  const orderingPhysicianNpi = String(formData.get("ordering_physician_npi") || "").trim();
  const orderingPhysicianDirectPhone = String(formData.get("ordering_physician_direct_phone") || "").trim();
  const orderingPhysicianSpecialty = String(formData.get("ordering_physician_specialty") || "").trim();
  const orderingPhysicianFax = String(formData.get("ordering_physician_fax") || "").trim();
  const planType = String(formData.get("plan_type") || "").trim();
  const selectedPatientId = String(formData.get("patient_id") || "").trim();

  if (
    !patientReference ||
    !payer ||
    !orderingPhysicianName ||
    !patientFullName ||
    !patientDob ||
    !orderingPhysicianNpi ||
    !orderingPhysicianDirectPhone
  ) {
    redirect(
      `/dashboard/requests/new?procedure_type=${procedureType}&error=${encodeURIComponent(
        "Patient reference, patient full name and DOB, payer, and ordering physician (name, NPI, direct phone) are required."
      )}`
    );
  }

  const { data: request, error: insertError } = await supabase
    .from("pa_requests")
    .insert({
      practice_id: profile.practice_id,
      created_by: user.id,
      patient_reference: patientReference,
      procedure_type: procedureType,
      payer,
      icd10_codes: icd10Codes,
      member_id: memberId || null,
      cpt_code: cptCode || null,
      authoring_mode: authoringMode,
      symptom_duration: caseFields.symptom_duration || null,
      case_fields: caseFields,
      red_flags: redFlags,
      intended_use: intendedUse || null,
      ordering_physician_name: orderingPhysicianName,
      ordering_physician_credentials: orderingPhysicianCredentials || null,
      patient_full_name: patientFullName || null,
      patient_dob: patientDob || null,
      patient_address: patientAddress || null,
      patient_city_state_zip: patientCityStateZip || null,
      patient_phone: patientPhone || null,
      insurance_group_number: insuranceGroupNumber || null,
      ordering_physician_npi: orderingPhysicianNpi || null,
      ordering_physician_direct_phone: orderingPhysicianDirectPhone || null,
      ordering_physician_specialty: orderingPhysicianSpecialty || null,
      ordering_physician_fax: orderingPhysicianFax || null,
      plan_type: planType || null,
      patient_id: selectedPatientId || null,
      status: "draft",
    })
    .select("id")
    .single();

  if (insertError || !request) {
    redirect(
      `/dashboard/requests/new?procedure_type=${procedureType}&error=${encodeURIComponent(
        insertError?.message || "Could not save this request."
      )}`
    );
    return;
  }

  await logAccess({ userId: user.id, action: "create", resourceType: "pa_request", resourceId: request.id });

  if (formData.get("save_physician") === "on" && orderingPhysicianNpi) {
    const { error: physicianError } = await supabase.from("physicians").upsert(
      {
        practice_id: profile.practice_id,
        name: orderingPhysicianName,
        credentials: orderingPhysicianCredentials || null,
        npi: orderingPhysicianNpi,
        direct_phone: orderingPhysicianDirectPhone || null,
        specialty: orderingPhysicianSpecialty || null,
        fax: orderingPhysicianFax || null,
      },
      { onConflict: "practice_id,npi" }
    );
    // Non-critical — the request itself is already saved either way, so a
    // failure here shouldn't block or crash the drafting flow.
    if (physicianError) console.error("Saving physician for reuse failed", physicianError);
  }

  if (formData.get("save_patient") === "on") {
    if (selectedPatientId) {
      // An existing patient was picked — apply any inline edits back to their record.
      const { error: patientUpdateError } = await supabase
        .from("patients")
        .update({
          address: patientAddress || null,
          phone: patientPhone || null,
          member_id: memberId || null,
          group_number: insuranceGroupNumber || null,
          plan_type: planType || null,
        })
        .eq("id", selectedPatientId);
      if (patientUpdateError) console.error("Updating saved patient failed", patientUpdateError);
    } else if (patientFullName) {
      // New patient — best-effort save from the name/DOB/insurance fields
      // collected here. Gender and a proper first/last split aren't
      // collected on this form; staff can fill those in from the Patients
      // tab, where a saved record's full identity fields belong.
      const { firstName, lastName } = splitFullName(patientFullName);
      const { data: newPatient, error: patientInsertError } = await supabase
        .from("patients")
        .upsert(
          {
            practice_id: profile.practice_id,
            first_name: firstName,
            last_name: lastName,
            dob: patientDob,
            gender: "Unspecified",
            address: patientAddress || null,
            phone: patientPhone || null,
            member_id: memberId || null,
            group_number: insuranceGroupNumber || null,
            plan_type: planType || null,
          },
          { onConflict: "practice_id,member_id" }
        )
        .select("id")
        .single();

      if (patientInsertError) {
        console.error("Saving patient for reuse failed", patientInsertError);
      } else if (newPatient) {
        await supabase.from("pa_requests").update({ patient_id: newPatient.id }).eq("id", request.id);
      }
    }
  }

  try {
    await draftLetterForRequest(request.id);
  } catch (err) {
    // The request row is already saved — don't crash the page over a
    // generation failure. Send staff to the request itself, where the
    // "Re-draft letter" button lets them retry without re-entering the case.
    console.error("draftLetterForRequest failed", err);
    redirect(
      `/dashboard/requests/${request.id}?error=${encodeURIComponent(
        `The request was saved, but drafting the letter failed: ${err instanceof Error ? err.message : "unknown error"}. Try Re-draft letter below.`
      )}`
    );
  }

  redirect(`/dashboard?drafted=${encodeURIComponent(patientReference)}`);
}

export async function draftLetterForRequest(requestId: string) {
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("pa_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (!request) throw new Error("Request not found");

  const procedure = await getProcedureByKey(request.procedure_type);
  if (!procedure) throw new Error(`Unknown or disabled procedure: ${request.procedure_type}`);

  const activeTemplate = await getActivePromptTemplate();
  const promptTemplate = activeTemplate?.content || DEFAULT_PROMPT_TEMPLATE;

  const result = await generateLetter({
    procedure,
    promptTemplate,
    payer: request.payer as PayerKey,
    patientReference: request.patient_reference,
    memberId: request.member_id ?? undefined,
    icd10Codes: request.icd10_codes,
    cptCode: request.cpt_code ?? undefined,
    authoringMode: request.authoring_mode as AuthoringMode,
    orderingPhysicianName: request.ordering_physician_name,
    orderingPhysicianCredentials: request.ordering_physician_credentials ?? undefined,
    intendedUse: request.intended_use ?? undefined,
    redFlags: request.red_flags,
    caseFields: request.case_fields as Record<string, string>,
    patientFullName: request.patient_full_name ?? undefined,
    patientDob: request.patient_dob ?? undefined,
    patientAddress: request.patient_address ?? undefined,
    patientCityStateZip: request.patient_city_state_zip ?? undefined,
    patientPhone: request.patient_phone ?? undefined,
    insuranceGroupNumber: request.insurance_group_number ?? undefined,
    orderingPhysicianNpi: request.ordering_physician_npi ?? undefined,
    orderingPhysicianDirectPhone: request.ordering_physician_direct_phone ?? undefined,
    orderingPhysicianSpecialty: request.ordering_physician_specialty ?? undefined,
    orderingPhysicianFax: request.ordering_physician_fax ?? undefined,
    planType: request.plan_type ?? undefined,
  });

  const { data: lastVersion } = await supabase
    .from("letters")
    .select("version")
    .eq("pa_request_id", requestId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase.from("letters").insert({
    pa_request_id: requestId,
    content: result.plainText,
    sections: result.sections,
    meta: result.meta,
    version: (lastVersion?.version || 0) + 1,
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
  });

  await notifyLetterReady(requestId, request.created_by);

  const { data: practice } = await supabase
    .from("practices")
    .select("id, plan, letters_used_this_period, letters_included")
    .eq("id", request.practice_id)
    .single();

  if (practice) {
    const newUsage = practice.letters_used_this_period + 1;
    await supabase.from("practices").update({ letters_used_this_period: newUsage }).eq("id", practice.id);

    if (practice.plan === "pilot") {
      await notifyUsageThreshold(practice.id, newUsage, practice.letters_included);
    }
  }
}
