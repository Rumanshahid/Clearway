"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// Patient-side half of the doctor-access system (see 0042_patient_doctor_access.sql).
// The doctor-side "Ask Access" request lives in dashboard/patients/access-actions.ts.
export async function setPatientDoctorAccessAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const doctorProfileId = String(formData.get("doctor_profile_id") || "");
  const grant = formData.get("grant") === "1";
  if (!doctorProfileId) return;

  const admin = await createAdminClient();
  await admin.from("patient_doctor_access").upsert({
    patient_account_id: user.id,
    doctor_profile_id: doctorProfileId,
    access_granted: grant,
    granted_at: grant ? new Date().toISOString() : null,
  });

  revalidatePath("/patient/profile");
}
