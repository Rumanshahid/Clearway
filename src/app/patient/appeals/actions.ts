"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
