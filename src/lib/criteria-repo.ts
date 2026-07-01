import { createClient } from "@/lib/supabase/server";
import type { FieldDef, PayerKey, ProcedureCriteria } from "@/lib/criteria";
import { PAYERS } from "@/lib/criteria";

// Server-side reads/writes for the `criteria` + `procedure_payer_toggles` tables.
// This is the runtime source of truth for procedure criteria (Phase 2+) — the
// PROCEDURES array in criteria.ts is now only the one-time seed source
// (supabase/migrations/0003_seed_criteria.sql) plus static types/PAYERS.

function rowToProcedure(row: {
  key: string;
  label: string;
  required_fields: unknown;
  red_flags: unknown;
  aetna: string;
  evicore: string;
  sources: string;
  prompt_notes: string;
}): ProcedureCriteria {
  return {
    key: row.key,
    label: row.label,
    requiredFields: (row.required_fields as FieldDef[]) || [],
    redFlags: (row.red_flags as string[]) || [],
    aetna: row.aetna,
    evicore: row.evicore,
    sources: row.sources,
    promptNotes: row.prompt_notes,
  };
}

export async function getEnabledProcedures(): Promise<ProcedureCriteria[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("criteria").select("*").eq("enabled", true).order("label");
  return (data || []).map(rowToProcedure);
}

export async function getAllProcedures(): Promise<(ProcedureCriteria & { enabled: boolean; id: string })[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("criteria").select("*").order("label");
  return (data || []).map((row) => ({ ...rowToProcedure(row), enabled: row.enabled, id: row.id }));
}

export async function getProcedureLabelMap(): Promise<Record<string, string>> {
  const supabase = await createClient();
  const { data } = await supabase.from("criteria").select("key, label");
  return Object.fromEntries((data || []).map((row) => [row.key, row.label]));
}

export async function getProcedureByKey(key: string): Promise<ProcedureCriteria | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("criteria").select("*").eq("key", key).maybeSingle();
  return data ? rowToProcedure(data) : null;
}

export async function getPayerTogglesForProcedure(key: string): Promise<Record<PayerKey, boolean>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("procedure_payer_toggles")
    .select("payer_key, enabled")
    .eq("procedure_key", key);

  const map = Object.fromEntries(PAYERS.map((p) => [p.key, true])) as Record<PayerKey, boolean>;
  for (const row of data || []) {
    map[row.payer_key as PayerKey] = row.enabled;
  }
  return map;
}

export async function getAllPayerToggles(): Promise<Record<string, Record<string, boolean>>> {
  const supabase = await createClient();
  const { data } = await supabase.from("procedure_payer_toggles").select("procedure_key, payer_key, enabled");

  const map: Record<string, Record<string, boolean>> = {};
  for (const row of data || []) {
    map[row.procedure_key] ||= {};
    map[row.procedure_key][row.payer_key] = row.enabled;
  }
  return map;
}

export async function upsertCriteria(input: {
  id?: string;
  key: string;
  label: string;
  requiredFields: FieldDef[];
  redFlags: string[];
  aetna: string;
  evicore: string;
  sources: string;
  promptNotes: string;
  enabled: boolean;
}) {
  const supabase = await createClient();
  const payload = {
    key: input.key,
    label: input.label,
    required_fields: input.requiredFields,
    red_flags: input.redFlags,
    aetna: input.aetna,
    evicore: input.evicore,
    sources: input.sources,
    prompt_notes: input.promptNotes,
    enabled: input.enabled,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    return supabase.from("criteria").update(payload).eq("id", input.id);
  }
  return supabase.from("criteria").insert(payload);
}

export async function setPayerToggle(procedureKey: string, payerKey: string, enabled: boolean) {
  const supabase = await createClient();
  return supabase
    .from("procedure_payer_toggles")
    .upsert({ procedure_key: procedureKey, payer_key: payerKey, enabled }, { onConflict: "procedure_key,payer_key" });
}

// ─────────────────────────────────────────────────────────────
// prompt templates
// ─────────────────────────────────────────────────────────────

export async function getActivePromptTemplate() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("prompt_templates")
    .select("*")
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function listPromptTemplateVersions() {
  const supabase = await createClient();
  const { data } = await supabase.from("prompt_templates").select("*").order("version", { ascending: false });
  return data || [];
}

export async function createPromptTemplateVersion(content: string, userId: string) {
  const supabase = await createClient();
  const { data: last } = await supabase
    .from("prompt_templates")
    .select("version")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase.from("prompt_templates").update({ is_active: false }).eq("is_active", true);

  return supabase.from("prompt_templates").insert({
    content,
    version: (last?.version || 0) + 1,
    is_active: true,
    created_by: userId,
  });
}

export async function activatePromptTemplateVersion(id: string) {
  const supabase = await createClient();
  await supabase.from("prompt_templates").update({ is_active: false }).eq("is_active", true);
  return supabase.from("prompt_templates").update({ is_active: true }).eq("id", id);
}

// ─────────────────────────────────────────────────────────────
// site content
// ─────────────────────────────────────────────────────────────

export async function getSiteContent(): Promise<Record<string, { value: string; visible: boolean }>> {
  const supabase = await createClient();
  const { data } = await supabase.from("site_content").select("*");
  const map: Record<string, { value: string; visible: boolean }> = {};
  for (const row of data || []) {
    map[row.key] = { value: row.value, visible: row.visible };
  }
  return map;
}

export async function upsertSiteContent(key: string, value: string, visible: boolean) {
  const supabase = await createClient();
  return supabase
    .from("site_content")
    .upsert({ key, value, visible, updated_at: new Date().toISOString() }, { onConflict: "key" });
}
