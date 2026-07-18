"use server";

import { renderToBuffer } from "@react-pdf/renderer";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { renderPatientCardPdf } from "@/lib/patient-card-pdf";
import { sendEmail } from "@/lib/email";

export async function emailPatientCardAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return { error: "Not signed in." };

  const admin = await createAdminClient();
  const { data: account } = await admin.from("patient_accounts").select("*").eq("id", user.id).maybeSingle();
  if (!account) return { error: "Patient account not found." };

  const buffer = await renderToBuffer(await renderPatientCardPdf(account));

  await sendEmail({
    to: user.email,
    subject: "Your Asaanbil Patient Card",
    html: `<p>Hi ${account.first_name},</p><p>Your Patient Reference ID is <strong>${account.patient_ref_id}</strong>. Give this to your doctor's front desk before any appointment — your information will auto-fill instantly.</p><p>Your patient card is attached as a PDF.</p>`,
    attachments: [{ filename: `asaanbil-${account.patient_ref_id}-card.pdf`, content: buffer }],
  });

  return { success: true };
}
