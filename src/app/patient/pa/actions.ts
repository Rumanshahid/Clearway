"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { notify } from "@/lib/notifications";
import { generatePatientLetter } from "@/lib/patientLetters";

export async function createPatientPaRequestAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const doctorProfileId = String(formData.get("doctor_profile_id") || "");
  const procedureDescription = String(formData.get("procedure_description") || "").trim();
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!doctorProfileId || !procedureDescription) {
    redirect(`/patient/pa?error=${encodeURIComponent("Choose a doctor and describe what you need prior authorization for.")}`);
  }

  const [{ data: account }, { data: profile }] = await Promise.all([
    supabase.from("patient_accounts").select("first_name, last_name, dob").eq("id", user.id).single(),
    supabase.from("patient_profiles").select("insurance_company, member_id").eq("patient_account_id", user.id).maybeSingle(),
  ]);

  // Written in the patient's own voice, not the staff clinical tool's --
  // see lib/patientLetters.ts. Best-effort: a generation failure still
  // lets the plain request through, just without a draft attached.
  const letterContent = await generatePatientLetter({
    kind: "prior_authorization",
    patientName: `${account?.first_name || ""} ${account?.last_name || ""}`.trim(),
    dob: account?.dob || "",
    insuranceCompany: profile?.insurance_company,
    memberId: profile?.member_id,
    description: procedureDescription,
    notes,
  });

  await supabase.from("patient_pa_requests").insert({
    patient_account_id: user.id,
    doctor_profile_id: doctorProfileId,
    procedure_description: procedureDescription,
    notes,
    letter_content: letterContent,
  });

  await notify({
    userId: doctorProfileId,
    type: "patient_pa_request",
    message: `${account?.first_name || "A patient"} ${account?.last_name || ""} submitted a prior authorization request: "${procedureDescription}"`,
    link: "/dashboard",
  });

  redirect("/patient/pa?submitted=1");
}
