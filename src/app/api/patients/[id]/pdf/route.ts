import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { PatientPdfDocument } from "@/lib/patient-pdf";
import { logAccess } from "@/lib/access-log";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: patient } = await supabase.from("patients").select("*").eq("id", id).single();
  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  await logAccess({ userId: user?.id || null, action: "download", resourceType: "patient", resourceId: id });

  const buffer = await renderToBuffer(PatientPdfDocument({ patient }));

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="asaanbil-${patient.patient_ref_id}.pdf"`,
    },
  });
}
