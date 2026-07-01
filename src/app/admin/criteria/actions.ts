"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { FieldDef, FieldType } from "@/lib/criteria";
import { setPayerToggle, upsertCriteria } from "@/lib/criteria-repo";
import { createClient } from "@/lib/supabase/server";

function parseRequiredFields(formData: FormData): FieldDef[] {
  const keys = formData.getAll("field_key").map(String);
  const labels = formData.getAll("field_label").map(String);
  const types = formData.getAll("field_type").map(String) as FieldType[];
  const requireds = formData.getAll("field_required").map(String);
  const helpTexts = formData.getAll("field_help").map(String);
  const optionsList = formData.getAll("field_options").map(String);

  const fields: FieldDef[] = [];
  for (let i = 0; i < keys.length; i++) {
    if (!keys[i].trim()) continue;
    const field: FieldDef = {
      key: keys[i].trim(),
      label: labels[i]?.trim() || keys[i].trim(),
      type: (types[i] as FieldType) || "text",
      required: requireds[i] === "true" || requireds[i] === "on",
      helpText: helpTexts[i]?.trim() || undefined,
    };
    if (field.type === "select" && optionsList[i]?.trim()) {
      field.options = optionsList[i].split(",").map((o) => o.trim()).filter(Boolean);
    }
    fields.push(field);
  }
  return fields;
}

export async function saveCriteriaAction(formData: FormData) {
  const id = String(formData.get("id") || "") || undefined;
  const key = String(formData.get("key") || "").trim();
  const label = String(formData.get("label") || "").trim();

  if (!key || !label) {
    redirect(`/admin/criteria/${id ? key : "_new"}?error=${encodeURIComponent("Key and label are required.")}`);
  }

  const redFlags = String(formData.get("red_flags") || "")
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean);

  await upsertCriteria({
    id,
    key,
    label,
    requiredFields: parseRequiredFields(formData),
    redFlags,
    aetna: String(formData.get("aetna") || ""),
    evicore: String(formData.get("evicore") || ""),
    sources: String(formData.get("sources") || ""),
    promptNotes: String(formData.get("prompt_notes") || ""),
    enabled: formData.get("enabled") === "on",
  });

  revalidatePath("/admin/criteria");
  redirect("/admin/criteria");
}

export async function toggleEnabledAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const enabled = String(formData.get("enabled") || "") !== "true";

  const supabase = await createClient();
  await supabase.from("criteria").update({ enabled }).eq("id", id);

  revalidatePath("/admin/criteria");
}

export async function togglePayerAction(formData: FormData) {
  const procedureKey = String(formData.get("procedure_key") || "");
  const payerKey = String(formData.get("payer_key") || "");
  const enabled = String(formData.get("enabled") || "") !== "true";

  await setPayerToggle(procedureKey, payerKey, enabled);
  revalidatePath(`/admin/criteria/${procedureKey}`);
}
