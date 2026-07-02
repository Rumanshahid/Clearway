import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;
import { generateLetter } from "@/lib/anthropic";
import { getProcedureByKey } from "@/lib/criteria-repo";
import type { PayerKey } from "@/lib/criteria";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "super_admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { template, procedureKey } = (await request.json()) as { template: string; procedureKey: string };
  if (!template?.trim()) {
    return NextResponse.json({ error: "Template can't be empty" }, { status: 400 });
  }

  const procedure = await getProcedureByKey(procedureKey);
  if (!procedure) {
    return NextResponse.json({ error: "Unknown procedure" }, { status: 400 });
  }

  const dummyCaseFields: Record<string, string> = {};
  for (const field of procedure.requiredFields) {
    dummyCaseFields[field.key] = field.options?.[0] || field.helpText || `Sample ${field.label.toLowerCase()}`;
  }

  try {
    const content = await generateLetter({
      procedure,
      promptTemplate: template,
      payer: "aetna" as PayerKey,
      patientReference: "PT-PREVIEW-01",
      icd10Codes: ["M54.5"],
      orderingPhysicianName: "Dr. Jane Sample",
      orderingPhysicianCredentials: "MD",
      intendedUse: "Preview / test generation",
      redFlags: [],
      caseFields: dummyCaseFields,
    });
    return NextResponse.json({ content });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Generation failed" }, { status: 500 });
  }
}
