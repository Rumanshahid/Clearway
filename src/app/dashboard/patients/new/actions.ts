"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseCsv, normalizeCsvHeader } from "@/lib/csv";
import { PATIENT_CSV_COLUMNS } from "@/lib/patients";
import type { PatientStatus } from "@/lib/database.types";
import { logAccess } from "@/lib/access-log";
import { requireSectionAccess } from "@/lib/permissions";

function readPatientFields(formData: FormData) {
  const str = (key: string) => String(formData.get(key) || "").trim();
  return {
    first_name: str("first_name"),
    middle_name: str("middle_name") || null,
    last_name: str("last_name"),
    dob: str("dob"),
    gender: str("gender"),
    status: (str("status") || "active") as PatientStatus,
    ssn_last4: str("ssn_last4") || null,
    preferred_language: str("preferred_language") || null,
    address: str("address") || null,
    city: str("city") || null,
    state: str("state") || null,
    zip: str("zip") || null,
    phone: str("phone") || null,
    mobile_phone: str("mobile_phone") || null,
    email: str("email") || null,
    preferred_contact_method: str("preferred_contact_method") || null,
    best_time_to_call: str("best_time_to_call") || null,
    emergency_contact_name: str("emergency_contact_name") || null,
    emergency_contact_phone: str("emergency_contact_phone") || null,
    emergency_contact_relationship: str("emergency_contact_relationship") || null,
    insurance_company: str("insurance_company") || null,
    plan_type: str("plan_type") || null,
    state_of_plan: str("state_of_plan") || null,
    member_id: str("member_id") || null,
    group_number: str("group_number") || null,
    plan_name: str("plan_name") || null,
    effective_date: str("effective_date") || null,
    coverage_end_date: str("coverage_end_date") || null,
    insurance_phone: str("insurance_phone") || null,
    insurance_pa_fax: str("insurance_pa_fax") || null,
    has_secondary_insurance: formData.get("has_secondary_insurance") === "on",
    secondary_insurance_company: str("secondary_insurance_company") || null,
    secondary_plan_type: str("secondary_plan_type") || null,
    secondary_member_id: str("secondary_member_id") || null,
    secondary_group_number: str("secondary_group_number") || null,
    cob_order: str("cob_order") || null,
    usual_physician_id: str("usual_physician_id") || null,
    primary_diagnosis_icd10: str("primary_diagnosis_icd10") || null,
    primary_diagnosis_description: str("primary_diagnosis_description") || null,
    known_drug_allergies: str("known_drug_allergies") || null,
    current_medications: str("current_medications") || null,
    consent_obtained: formData.get("consent_obtained") === "on",
    consent_date: str("consent_date") || null,
    consent_method: str("consent_method") || null,
    coordinator_notes: str("coordinator_notes") || null,
    preferred_letter_author_mode: str("preferred_letter_author_mode") || null,
    preferred_submission_method: str("preferred_submission_method") || null,
    special_handling_flags: formData.getAll("special_handling_flags").map(String),
    internal_tags: str("internal_tags")
      ? str("internal_tags").split(",").map((t) => t.trim()).filter(Boolean)
      : [],
  };
}

export async function createPatientAction(formData: FormData) {
  await requireSectionAccess("patients");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase.from("profiles").select("practice_id").eq("id", user.id).single();
  if (!profile?.practice_id) redirect("/onboarding");

  const fields = readPatientFields(formData);

  if (!fields.first_name || !fields.last_name || !fields.dob || !fields.gender) {
    redirect(`/dashboard/patients/new?error=${encodeURIComponent("First name, last name, date of birth, and gender are required.")}`);
  }

  const { data: patient, error } = await supabase
    .from("patients")
    .insert({ practice_id: profile.practice_id, ...fields })
    .select("id")
    .single();

  if (error || !patient) {
    console.error("createPatientAction insert failed", error);
    redirect(`/dashboard/patients/new?error=${encodeURIComponent(error?.message || "Could not save this patient.")}`);
    return;
  }

  redirect(`/dashboard/patients/${patient.id}`);
}

export async function updatePatientAction(patientId: string, formData: FormData) {
  await requireSectionAccess("patients");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const fields = readPatientFields(formData);

  if (!fields.first_name || !fields.last_name || !fields.dob || !fields.gender) {
    redirect(`/dashboard/patients/${patientId}?error=${encodeURIComponent("First name, last name, date of birth, and gender are required.")}`);
  }

  const { error } = await supabase.from("patients").update(fields).eq("id", patientId);
  if (error) {
    redirect(`/dashboard/patients/${patientId}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/dashboard/patients/${patientId}`);
}

export async function deletePatientAction(patientId: string) {
  await requireSectionAccess("patients");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  // pa_requests.patient_id and claim_denials.patient_id are both
  // "on delete set null" — deleting a patient never cascades into
  // deleting requests or denials, it just unlinks them.
  await supabase.from("patients").delete().eq("id", patientId);
  await logAccess({ userId: user.id, action: "delete", resourceType: "patient", resourceId: patientId });

  redirect("/dashboard/patients");
}

export async function importPatientsCsvAction(formData: FormData) {
  await requireSectionAccess("patients");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase.from("profiles").select("practice_id").eq("id", user.id).single();
  if (!profile?.practice_id) redirect("/onboarding");

  const file = formData.get("csv_file") as File | null;
  if (!file || file.size === 0) {
    redirect(`/dashboard/patients/new?error=${encodeURIComponent("Choose a CSV file to import.")}`);
    return;
  }

  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length < 2) {
    redirect(`/dashboard/patients/new?error=${encodeURIComponent("CSV has no data rows.")}`);
    return;
  }

  const header = rows[0].map(normalizeCsvHeader);
  const columnIndex = new Map<string, number>();
  header.forEach((h, i) => {
    if ((PATIENT_CSV_COLUMNS as readonly string[]).includes(h)) columnIndex.set(h, i);
  });

  let imported = 0;
  const errors: string[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const get = (col: string) => {
      const idx = columnIndex.get(col);
      return idx === undefined ? "" : (row[idx] || "").trim();
    };

    const first_name = get("first_name");
    const last_name = get("last_name");
    const dob = get("dob");
    const gender = get("gender");

    if (!first_name || !last_name || !dob || !gender) {
      errors.push(`Row ${r + 1}: missing first name, last name, DOB, or gender — skipped.`);
      continue;
    }

    const { error } = await supabase.from("patients").insert({
      practice_id: profile.practice_id,
      first_name,
      last_name,
      dob,
      gender,
      middle_name: get("middle_name") || null,
      ssn_last4: get("ssn_last4") || null,
      preferred_language: get("preferred_language") || null,
      phone: get("phone") || null,
      mobile_phone: get("mobile_phone") || null,
      email: get("email") || null,
      address: get("address") || null,
      city: get("city") || null,
      state: get("state") || null,
      zip: get("zip") || null,
      insurance_company: get("insurance_company") || null,
      plan_type: get("plan_type") || null,
      state_of_plan: get("state_of_plan") || null,
      member_id: get("member_id") || null,
      group_number: get("group_number") || null,
      plan_name: get("plan_name") || null,
    });

    if (error) {
      errors.push(`Row ${r + 1}: ${error.message}`);
      continue;
    }
    imported++;
  }

  const params = new URLSearchParams();
  params.set("imported", String(imported));
  params.set("skipped", String(errors.length));
  if (errors.length > 0) params.set("errors", errors.slice(0, 5).join(" | "));
  redirect(`/dashboard/patients?${params.toString()}`);
}
