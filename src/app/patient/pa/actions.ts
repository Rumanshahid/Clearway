"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
