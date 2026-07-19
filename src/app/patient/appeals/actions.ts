"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { generatePatientAppealLetter } from "@/lib/patient-letters";

export async function createPatientAppealRequestAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const doctor_profile_id = String(formData.get("doctor_profile_id") || "").trim();
  const claim_number = String(formData.get("claim_number") || "").trim() || null;
  const date_of_service = String(formData.get("date_of_service") || "").trim() || null;
  const denial_reason = String(formData.get("denial_reason") || "").trim();
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!doctor_profile_id || !denial_reason) {
    redirect("/patient/appeals?error=Please+select+a+doctor+and+describe+the+denial+reason.");
  }

  const { error } = await supabase.from("patient_appeal_requests").insert({
    patient_account_id: user.id,
    doctor_profile_id,
    claim_number,
    date_of_service,
    denial_reason,
    notes,
  });

  if (error) {
    redirect(`/patient/appeals?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/patient/appeals?submitted=1");
}

export async function draftPatientAppealLetterAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const requestId = String(formData.get("request_id") || "");
  const admin = await createAdminClient();

  const { data: request } = await admin
    .from("patient_appeal_requests")
    .select("id, patient_account_id, doctor_profile_id, claim_number, date_of_service, denial_reason, notes")
    .eq("id", requestId)
    .eq("patient_account_id", user.id)
    .maybeSingle();
  if (!request) redirect("/patient/appeals?error=Request+not+found.");

  const [{ data: account }, { data: doctorProfile }] = await Promise.all([
    admin.from("patient_accounts").select("first_name, last_name, dob, patient_ref_id").eq("id", user.id).single(),
    admin.from("profiles").select("full_name").eq("id", request.doctor_profile_id).maybeSingle(),
  ]);

  const letter = await generatePatientAppealLetter({
    patientFullName: `${account!.first_name} ${account!.last_name}`,
    patientDob: account!.dob,
    patientRefId: account!.patient_ref_id,
    doctorName: doctorProfile?.full_name || "your doctor",
    claimNumber: request.claim_number,
    dateOfService: request.date_of_service,
    denialReason: request.denial_reason,
    notes: request.notes,
  });

  // patient_appeal_requests has no update RLS policy either -- same
  // admin-client write, filtered to the caller's own already-verified request.
  await admin.from("patient_appeal_requests").update({ letter_content: letter }).eq("id", requestId);

  revalidatePath("/patient/appeals");
}
