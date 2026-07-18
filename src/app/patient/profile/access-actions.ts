"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function toggleDoctorAccessAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const doctorProfileId = String(formData.get("doctor_profile_id") || "");
  const grant = formData.get("grant") === "on";

  // RLS (pda_update_patient_only / pda_insert_own) already scopes this to
  // the caller's own patient_account_id -- session client is fine, this
  // isn't an identity-routing check like the admin-client uses elsewhere.
  await supabase
    .from("patient_doctor_access")
    .update({ access_granted: grant, granted_at: grant ? new Date().toISOString() : null })
    .eq("patient_account_id", user.id)
    .eq("doctor_profile_id", doctorProfileId);

  revalidatePath("/patient/profile");
}
