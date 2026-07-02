import { createAdminClient, createClient } from "@/lib/supabase/server";
import { notify } from "@/lib/notifications";

async function getEmail(userId: string): Promise<string | null> {
  const admin = await createAdminClient();
  const { data } = await admin.auth.admin.getUserById(userId);
  return data.user?.email || null;
}

export async function notifyLetterReady(requestId: string, createdByUserId: string) {
  const supabase = await createClient();
  const { data: request } = await supabase
    .from("pa_requests")
    .select("patient_reference")
    .eq("id", requestId)
    .single();
  if (!request) return;

  const email = await getEmail(createdByUserId);
  await notify({
    userId: createdByUserId,
    email,
    type: "letter_ready",
    message: `Your letter for ${request.patient_reference} is ready to review.`,
    link: `/dashboard/requests/${requestId}`,
    emailSubject: "Your asaanbil.com letter is ready to review",
    emailHtml: `<p>The draft letter for <strong>${request.patient_reference}</strong> is ready.</p><p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/requests/${requestId}">Review it now →</a></p>`,
  });
}

export async function notifyRequestStatusChange(requestId: string, status: "approved" | "denied") {
  const supabase = await createClient();
  const { data: request } = await supabase
    .from("pa_requests")
    .select("patient_reference, created_by")
    .eq("id", requestId)
    .single();
  if (!request) return;

  const email = await getEmail(request.created_by);
  const verb = status === "approved" ? "approved" : "denied";
  await notify({
    userId: request.created_by,
    email,
    type: `request_${status}`,
    message: `Request for ${request.patient_reference} was marked ${verb}.`,
    link: `/dashboard/requests/${requestId}`,
    emailSubject: `Prior auth ${verb}: ${request.patient_reference}`,
    emailHtml: `<p>The request for <strong>${request.patient_reference}</strong> was marked <strong>${verb}</strong>.</p><p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/requests/${requestId}">View request →</a></p>`,
  });
}

export async function notifyUsageThreshold(practiceId: string, used: number, included: number) {
  const warningAt = Math.ceil(included * 0.8);
  if (used !== warningAt && used !== included) return;

  const supabase = await createClient();
  const { data: admins } = await supabase
    .from("profiles")
    .select("id")
    .eq("practice_id", practiceId)
    .eq("role", "clinic_admin");

  const message =
    used >= included
      ? `You've used all ${included} letters on the Pilot plan. Upgrade to keep drafting.`
      : `You've used ${used} of ${included} Pilot-plan letters.`;

  for (const admin of admins || []) {
    const email = await getEmail(admin.id);
    await notify({
      userId: admin.id,
      email,
      type: "usage_threshold",
      message,
      link: "/dashboard/billing",
      emailSubject: used >= included ? "You've used all your asaanbil.com Pilot letters" : "Approaching your asaanbil.com Pilot limit",
      emailHtml: `<p>${message}</p><p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/billing">Manage billing →</a></p>`,
    });
  }
}
