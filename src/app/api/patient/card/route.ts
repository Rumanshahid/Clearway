import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { renderPatientCardPdf } from "@/lib/patient-card-pdf";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminClient();
  const { data: account } = await admin.from("patient_accounts").select("*").eq("id", user.id).maybeSingle();
  if (!account) return NextResponse.json({ error: "Patient account not found" }, { status: 404 });

  const buffer = await renderToBuffer(await renderPatientCardPdf(account));

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="asaanbil-${account.patient_ref_id}-card.pdf"`,
    },
  });
}
