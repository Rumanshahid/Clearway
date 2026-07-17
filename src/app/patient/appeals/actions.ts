"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { notify } from "@/lib/notifications";

export async function createPatientAppealRequestAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const doctorProfileId = String(formData.get("doctor_profile_id") || "");
  const claimNumber = String(formData.get("claim_number") || "").trim() || null;
  const dateOfService = String(formData.get("date_of_service") || "").trim() || null;
  const denialReason = String(formData.get("denial_reason") || "").trim();
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!doctorProfileId || !denialReason) {
    redirect(`/patient/appeals?error=${encodeURIComponent("Choose a doctor and describe why the claim was denied.")}`);
  }

  const { data: account } = await supabase.from("patient_accounts").select("first_name, last_name").eq("id", user.id).single();

  await supabase.from("patient_appeal_requests").insert({
    patient_account_id: user.id,
    doctor_profile_id: doctorProfileId,
    claim_number: claimNumber,
    date_of_service: dateOfService,
    denial_reason: denialReason,
    notes,
  });

  await notify({
    userId: doctorProfileId,
    type: "patient_appeal_request",
    message: `${account?.first_name || "A patient"} ${account?.last_name || ""} needs help appealing a denied claim.`,
    link: "/dashboard/appeals",
  });

  redirect("/patient/appeals?submitted=1");
}
