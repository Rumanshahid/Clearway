"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function logEligibilityCheckAction(formData: FormData) {
  const patientId = String(formData.get("patient_id") || "");
  const status = String(formData.get("status") || "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase.from("profiles").select("practice_id").eq("id", user.id).single();
  if (!profile?.practice_id) redirect("/onboarding");

  if (!patientId || !status) {
    redirect(`/dashboard/patients/${patientId}?error=${encodeURIComponent("Status is required to log an eligibility check.")}`);
    return;
  }

  const str = (key: string) => String(formData.get(key) || "").trim();
  const num = (key: string) => {
    const v = str(key);
    return v ? Number(v) : null;
  };

  await supabase.from("eligibility_checks").insert({
    practice_id: profile.practice_id,
    patient_id: patientId,
    checked_by: user.id,
    payer: str("payer") || null,
    member_id: str("member_id") || null,
    plan_type: str("plan_type") || null,
    status,
    method: str("method") || "Payer portal",
    deductible_remaining: num("deductible_remaining"),
    copay_amount: num("copay_amount"),
    notes: str("notes") || null,
  });

  revalidatePath(`/dashboard/patients/${patientId}`);
}

export async function deleteEligibilityCheckAction(formData: FormData) {
  const checkId = String(formData.get("check_id") || "");
  const patientId = String(formData.get("patient_id") || "");

  const supabase = await createClient();
  await supabase.from("eligibility_checks").delete().eq("id", checkId);

  revalidatePath(`/dashboard/patients/${patientId}`);
}
