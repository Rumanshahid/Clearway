"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { notify } from "@/lib/notifications";

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

  const { data: account } = await supabase.from("patient_accounts").select("first_name, last_name").eq("id", user.id).single();

  await supabase.from("patient_pa_requests").insert({
    patient_account_id: user.id,
    doctor_profile_id: doctorProfileId,
    procedure_description: procedureDescription,
    notes,
  });

  await notify({
    userId: doctorProfileId,
    type: "patient_pa_request",
    message: `${account?.first_name || "A patient"} ${account?.last_name || ""} submitted a prior authorization request: "${procedureDescription}"`,
    link: "/dashboard",
  });

  redirect("/patient/pa?submitted=1");
}
