"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { generatePatientPaLetter } from "@/lib/patient-letters";

export async function createPatientPaRequestAction(formData: FormData) {
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

  const { error } = await supabase.from("patient_pa_requests").insert({
    patient_account_id: user.id,
    doctor_profile_id,
    procedure_description,
    notes,
  });

  if (error) {
    redirect(`/patient/pa?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/patient/pa?submitted=1");
}

export async function draftPatientPaLetterAction(formData: FormData) {
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

  const [{ data: account }, { data: doctorProfile }] = await Promise.all([
    admin.from("patient_accounts").select("first_name, last_name, dob, patient_ref_id").eq("id", user.id).single(),
    admin.from("profiles").select("full_name").eq("id", request.doctor_profile_id).maybeSingle(),
  ]);

  const letter = await generatePatientPaLetter({
    patientFullName: `${account!.first_name} ${account!.last_name}`,
    patientDob: account!.dob,
    patientRefId: account!.patient_ref_id,
    doctorName: doctorProfile?.full_name || "your doctor",
    procedureDescription: request.procedure_description,
    notes: request.notes,
  });

  // patient_pa_requests has no update RLS policy (patients can only
  // insert/select their own rows), so this write goes through the admin
  // client -- still filtered to the caller's own already-verified request.
  await admin.from("patient_pa_requests").update({ letter_content: letter }).eq("id", requestId);

  revalidatePath("/patient/pa");
}
