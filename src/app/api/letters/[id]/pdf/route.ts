import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { getProcedureByKey } from "@/lib/criteria-repo";
import { LetterPdfDocument } from "@/lib/letter-pdf";
import { logAccess } from "@/lib/access-log";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: letter } = await supabase.from("letters").select("*, pa_requests(*)").eq("id", id).single();
  if (!letter) {
    return NextResponse.json({ error: "Letter not found" }, { status: 404 });
  }

  const paRequest = Array.isArray(letter.pa_requests) ? letter.pa_requests[0] : letter.pa_requests;
  const procedure = await getProcedureByKey(paRequest.procedure_type);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  await logAccess({ userId: user?.id || null, action: "download", resourceType: "letter", resourceId: id });

  const buffer = await renderToBuffer(
    LetterPdfDocument({
      patientReference: paRequest.patient_reference,
      procedureLabel: procedure?.label || paRequest.procedure_type,
      payer: paRequest.payer,
      content: letter.content,
    })
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="clearway-${paRequest.patient_reference}.pdf"`,
    },
  });
}
