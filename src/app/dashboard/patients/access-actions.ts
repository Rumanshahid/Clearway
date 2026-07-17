"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { notify } from "@/lib/notifications";

// Doctor-side half of the access system (see 0042_patient_doctor_access.sql
// and patient/access-actions.ts for the patient's half). Requesting access
// never grants it directly -- it just records the request and notifies the
// patient, who has to tick the box themselves on their own dashboard.
export async function requestPatientAccessAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const patientAccountId = String(formData.get("patient_account_id") || "");
  if (!patientAccountId) return;

  const { data: myProfile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();

  const admin = await createAdminClient();
  await admin.from("patient_doctor_access").upsert({
    patient_account_id: patientAccountId,
    doctor_profile_id: user.id,
    access_granted: false,
    requested_at: new Date().toISOString(),
  });

  await notify({
    userId: patientAccountId,
    type: "doctor_access_request",
    message: `${myProfile?.full_name || "A doctor"} is requesting access to your health information.`,
    link: "/patient",
  });

  revalidatePath("/dashboard/patients", "layout");
}
