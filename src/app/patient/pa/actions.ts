"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { generatePatientPaLetter } from "@/lib/patient-letters";
import { loadPatientLetterContext } from "@/lib/patient-contact";

// Single action: creates the request and drafts the letter in one step, so
// the patient never sees an empty "submitted, no letter yet" state -- the
// old two-click submit-then-draft flow was confusing and (via a missing
// letter_content column) is what caused requests to silently disappear.
export async function createAndDraftPatientPaRequestAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const doctor_profile_id = String(formData.get("doctor_profile_id") || "").trim();
  const procedure_description = String(formData.get("procedure_description") || "").trim();
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!doctor_profile_id || !procedure_description) {
    redirect("/patient/pa?error=Please+select+a+doctor+and+describe+the+procedure.");
  }

  const { data: inserted, error } = await supabase
    .from("patient_pa_requests")
    .insert({ patient_account_id: user.id, doctor_profile_id, procedure_description, notes })
    .select("id")
    .single();

  if (error || !inserted) {
    redirect(`/patient/pa?error=${encodeURIComponent(error?.message || "Could not create the request.")}`);
  }

  const admin = await createAdminClient();
  try {
    const { patientFullName, patientDob, patientRefId, contact } = await loadPatientLetterContext(admin, user.id);
    const { data: doctorProfile } = await admin.from("profiles").select("full_name").eq("id", doctor_profile_id).maybeSingle();

    const { letter, riskFlags, suggestions } = await generatePatientPaLetter({
      patientFullName,
      patientDob,
      patientRefId,
      doctorName: doctorProfile?.full_name || "your doctor",
      procedureDescription: procedure_description,
      notes,
      contact,
    });

    await admin.from("patient_pa_requests").update({ letter_content: letter, risk_flags: riskFlags, suggestions }).eq("id", inserted.id);
  } catch (err) {
    console.error("createAndDraftPatientPaRequestAction: letter generation failed", err);
    redirect(`/patient/pa?submitted=${inserted.id}&error=${encodeURIComponent("Request saved, but drafting the letter failed. Use Re-draft below to try again.")}`);
  }

  redirect(`/patient/pa?submitted=${inserted.id}`);
}

export async function redraftPatientPaLetterAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const requestId = String(formData.get("request_id") || "");
  const admin = await createAdminClient();

  const { data: request } = await admin
    .from("patient_pa_requests")
    .select("id, patient_account_id, doctor_profile_id, procedure_description, notes")
    .eq("id", requestId)
    .eq("patient_account_id", user.id)
    .maybeSingle();
  if (!request) redirect("/patient/pa?error=Request+not+found.");

  const { patientFullName, patientDob, patientRefId, contact } = await loadPatientLetterContext(admin, user.id);
  const { data: doctorProfile } = await admin.from("profiles").select("full_name").eq("id", request.doctor_profile_id).maybeSingle();

  const { letter, riskFlags, suggestions } = await generatePatientPaLetter({
    patientFullName,
    patientDob,
    patientRefId,
    doctorName: doctorProfile?.full_name || "your doctor",
    procedureDescription: request.procedure_description,
    notes: request.notes,
    contact,
  });

  // patient_pa_requests has no update RLS policy (patients can only
  // insert/select their own rows), so this write goes through the admin
  // client -- still filtered to the caller's own already-verified request.
  await admin.from("patient_pa_requests").update({ letter_content: letter, risk_flags: riskFlags, suggestions }).eq("id", requestId);

  revalidatePath("/patient/pa");
}

export async function editPatientPaLetterAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const requestId = String(formData.get("request_id") || "");
  const letterContent = String(formData.get("letter_content") || "");
  const admin = await createAdminClient();

  const { data: request } = await admin
    .from("patient_pa_requests")
    .select("id")
    .eq("id", requestId)
    .eq("patient_account_id", user.id)
    .maybeSingle();
  if (!request) redirect("/patient/pa?error=Request+not+found.");

  await admin.from("patient_pa_requests").update({ letter_content: letterContent }).eq("id", requestId);

  revalidatePath("/patient/pa");
}
