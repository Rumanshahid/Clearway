import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { PatientAccountPdfDocument } from "@/lib/patient-account-pdf";

export const runtime = "nodejs";

// No id/ref-id param on this route on purpose -- a sequential Ref ID
// (PTA-000123) is guessable, so this always resolves "whose card" from the
// caller's own session or their own short-lived signup cookie, never from
// anything passed in the request.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let fullName: string;
  let patientRefId: string;

  if (user) {
    const { data: account } = await supabase
      .from("patient_accounts")
      .select("first_name, last_name, patient_ref_id")
      .eq("id", user.id)
      .maybeSingle();
    if (!account) {
      return NextResponse.json({ error: "Not a patient account" }, { status: 404 });
    }
    fullName = `${account.first_name} ${account.last_name}`;
    patientRefId = account.patient_ref_id;
  } else {
    const cookieStore = await cookies();
    const refId = cookieStore.get("patient_signup_ref")?.value;
    const name = cookieStore.get("patient_signup_name")?.value;
    if (!refId || !name) {
      return NextResponse.json({ error: "Sign in to download your card" }, { status: 401 });
    }
    fullName = name;
    patientRefId = refId;
  }

  const qrDataUrl = await QRCode.toDataURL(patientRefId, { margin: 1, width: 240 });
  const buffer = await renderToBuffer(PatientAccountPdfDocument({ fullName, patientRefId, qrDataUrl }));

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="asaanbil-${patientRefId}.pdf"`,
    },
  });
}
