"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { requireSectionAccess } from "@/lib/permissions";
import { notify } from "@/lib/notifications";

export async function requestPatientAccessAction(formData: FormData) {
  const profile = await requireSectionAccess("patients");
  const patientAccountId = String(formData.get("patient_account_id") || "");
  const patientId = String(formData.get("patient_id") || "");

  const admin = await createAdminClient();
  const { data: existing } = await admin
    .from("patient_doctor_access")
    .select("access_granted, requested_at")
    .eq("patient_account_id", patientAccountId)
    .eq("doctor_profile_id", profile.userId)
    .maybeSingle();

  if (!existing) {
    await admin.from("patient_doctor_access").insert({
      patient_account_id: patientAccountId,
      doctor_profile_id: profile.userId,
      requested_at: new Date().toISOString(),
    });

    const { data: staffProfile } = await admin.from("profiles").select("full_name").eq("id", profile.userId).maybeSingle();
    await notify({
      userId: patientAccountId,
      type: "access_request",
      message: `${staffProfile?.full_name || "A doctor"} requested access to your profile.`,
      link: "/patient/profile",
    });
  }

  revalidatePath(`/dashboard/patients/${patientId}`);
}
