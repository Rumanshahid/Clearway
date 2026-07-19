import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { PatientLetterPdfDocument } from "@/lib/patient-letter-pdf";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const admin = await createAdminClient();
  const { data: appeal } = await admin
    .from("patient_appeal_requests")
    .select("letter_content")
    .eq("id", id)
    .eq("patient_account_id", user.id)
    .maybeSingle();
  if (!appeal?.letter_content) return NextResponse.json({ error: "Letter not found" }, { status: 404 });

  const { data: account } = await admin.from("patient_accounts").select("patient_ref_id").eq("id", user.id).single();

  const buffer = await renderToBuffer(
    PatientLetterPdfDocument({
      title: "Claim Appeal Letter",
      patientReference: account?.patient_ref_id || "",
      content: appeal.letter_content,
    })
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="asaanbil-appeal-${account?.patient_ref_id || id}.pdf"`,
    },
  });
}
