"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { DenialStatus } from "@/lib/database.types";

export async function updateDenialStatusAction(formData: FormData) {
  const denialId = String(formData.get("denial_id") || "");
  const status = String(formData.get("status") || "") as DenialStatus;
  const recoveredAmount = String(formData.get("recovered_amount") || "").trim();

  const supabase = await createClient();
  const update: { status: DenialStatus; updated_at: string; amount_recovered?: number } = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === "won" && recoveredAmount) {
    update.amount_recovered = Number(recoveredAmount);
  }

  await supabase.from("claim_denials").update(update).eq("id", denialId);

  revalidatePath(`/dashboard/appeals/${denialId}`);
  revalidatePath("/dashboard/appeals");
}

export async function updateClaimLetterContentAction(formData: FormData) {
  const letterId = String(formData.get("letter_id") || "");
  const denialId = String(formData.get("denial_id") || "");
  const content = String(formData.get("content") || "");
  const sectionsRaw = formData.get("sections");

  const supabase = await createClient();
  const update: { content: string; sections?: Record<string, { label: string; content: string }> } = { content };
  if (sectionsRaw) {
    update.sections = JSON.parse(String(sectionsRaw));
  }
  await supabase.from("claim_appeal_letters").update(update).eq("id", letterId);

  revalidatePath(`/dashboard/appeals/${denialId}`);
}

export async function redraftClaimAppealAction(formData: FormData) {
  const denialId = String(formData.get("denial_id") || "");

  const { draftClaimAppealLetter } = await import("../new/actions");
  try {
    await draftClaimAppealLetter(denialId);
  } catch (err) {
    console.error("redraftClaimAppealAction failed", err);
    redirect(
      `/dashboard/appeals/${denialId}?error=${encodeURIComponent(
        `Re-drafting failed: ${err instanceof Error ? err.message : "unknown error"}. You can try again.`
      )}`
    );
  }
  redirect(`/dashboard/appeals/${denialId}`);
}
