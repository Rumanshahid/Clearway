"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { BillingStatus, PracticePlan } from "@/lib/database.types";

export async function updatePracticeAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const plan = String(formData.get("plan") || "") as PracticePlan;
  const billingStatus = String(formData.get("billing_status") || "") as BillingStatus;
  const lettersIncluded = Number(formData.get("letters_included") || 0);
  const retentionMonths = Number(formData.get("retention_months") || 12);

  const supabase = await createClient();
  await supabase
    .from("practices")
    .update({ plan, billing_status: billingStatus, letters_included: lettersIncluded, retention_months: retentionMonths })
    .eq("id", id);

  revalidatePath(`/admin/practices/${id}`);
  revalidatePath("/admin/practices");
}

export async function resetUsageAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const supabase = await createClient();
  await supabase
    .from("practices")
    .update({ letters_used_this_period: 0, billing_period_start: new Date().toISOString().slice(0, 10) })
    .eq("id", id);

  revalidatePath(`/admin/practices/${id}`);
}
