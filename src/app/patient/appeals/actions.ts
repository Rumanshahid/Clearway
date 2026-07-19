"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { generatePatientAppealLetter } from "@/lib/patient-letters";
import { loadPatientLetterContext } from "@/lib/patient-contact";

export async function createAndDraftPatientAppealRequestAction(formData: FormData) {
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

  const { data: inserted, error } = await supabase
    .from("patient_appeal_requests")
    .insert({ patient_account_id: user.id, doctor_profile_id, claim_number, date_of_service, denial_reason, notes })
    .select("id")
    .single();

  if (error || !inserted) {
    redirect(`/patient/appeals?error=${encodeURIComponent(error?.message || "Could not create the appeal.")}`);
  }

  const admin = await createAdminClient();
  try {
    const { patientFullName, patientDob, patientRefId, contact } = await loadPatientLetterContext(admin, user.id);
    const { data: doctorProfile } = await admin.from("profiles").select("full_name").eq("id", doctor_profile_id).maybeSingle();

    const { letter, riskFlags, suggestions } = await generatePatientAppealLetter({
      patientFullName,
      patientDob,
      patientRefId,
      doctorName: doctorProfile?.full_name || "your doctor",
      claimNumber: claim_number,
      dateOfService: date_of_service,
      denialReason: denial_reason,
      notes,
      contact,
    });

    await admin.from("patient_appeal_requests").update({ letter_content: letter, risk_flags: riskFlags, suggestions }).eq("id", inserted.id);
  } catch (err) {
    console.error("createAndDraftPatientAppealRequestAction: letter generation failed", err);
    redirect(`/patient/appeals?submitted=${inserted.id}&error=${encodeURIComponent("Appeal saved, but drafting the letter failed. Use Re-draft below to try again.")}`);
  }

  redirect(`/patient/appeals?submitted=${inserted.id}`);
}

export async function redraftPatientAppealLetterAction(formData: FormData) {
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

  const { patientFullName, patientDob, patientRefId, contact } = await loadPatientLetterContext(admin, user.id);
  const { data: doctorProfile } = await admin.from("profiles").select("full_name").eq("id", request.doctor_profile_id).maybeSingle();

  const { letter, riskFlags, suggestions } = await generatePatientAppealLetter({
    patientFullName,
    patientDob,
    patientRefId,
    doctorName: doctorProfile?.full_name || "your doctor",
    claimNumber: request.claim_number,
    dateOfService: request.date_of_service,
    denialReason: request.denial_reason,
    notes: request.notes,
    contact,
  });

  // patient_appeal_requests has no update RLS policy either -- same
  // admin-client write, filtered to the caller's own already-verified request.
  await admin.from("patient_appeal_requests").update({ letter_content: letter, risk_flags: riskFlags, suggestions }).eq("id", requestId);

  revalidatePath("/patient/appeals");
  revalidatePath(`/patient/appeals/${requestId}`);
}

export async function editPatientAppealLetterAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const requestId = String(formData.get("request_id") || "");
  const letterContent = String(formData.get("letter_content") || "");
  const admin = await createAdminClient();

  const { data: request } = await admin
    .from("patient_appeal_requests")
    .select("id")
    .eq("id", requestId)
    .eq("patient_account_id", user.id)
    .maybeSingle();
  if (!request) redirect("/patient/appeals?error=Request+not+found.");

  await admin.from("patient_appeal_requests").update({ letter_content: letterContent }).eq("id", requestId);

  revalidatePath("/patient/appeals");
  revalidatePath(`/patient/appeals/${requestId}`);
}
