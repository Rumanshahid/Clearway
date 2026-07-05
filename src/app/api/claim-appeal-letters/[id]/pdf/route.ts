import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { ClaimLetterPdfDocument } from "@/lib/claim-letter-pdf";
import { logAccess } from "@/lib/access-log";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: letter } = await supabase.from("claim_appeal_letters").select("*").eq("id", id).single();
  if (!letter) {
    return NextResponse.json({ error: "Letter not found" }, { status: 404 });
  }

  const { data: denial } = await supabase
    .from("claim_denials")
    .select("claim_number, payer, patient_id")
    .eq("id", letter.claim_denial_id)
    .single();
  if (!denial) {
    return NextResponse.json({ error: "Claim denial not found" }, { status: 404 });
  }

  const { data: patient } = denial.patient_id
    ? await supabase.from("patients").select("first_name, last_name, patient_ref_id").eq("id", denial.patient_id).single()
    : { data: null };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  await logAccess({ userId: user?.id || null, action: "download", resourceType: "letter", resourceId: id });

  const patientLabel = patient ? `${patient.first_name} ${patient.last_name} (${patient.patient_ref_id})` : "Patient not on file";

  const buffer = await renderToBuffer(
    ClaimLetterPdfDocument({
      claimNumber: denial.claim_number || "",
      patientLabel,
      payer: denial.payer || "",
      content: letter.content,
      sections: letter.sections,
    })
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="asaanbil-appeal-${denial.claim_number || id}.pdf"`,
    },
  });
}
