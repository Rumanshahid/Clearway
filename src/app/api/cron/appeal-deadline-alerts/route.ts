import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { notify } from "@/lib/notifications";

export const runtime = "nodejs";

const ALERT_THRESHOLDS = [30, 14, 7, 3];

async function getEmail(admin: Awaited<ReturnType<typeof createAdminClient>>, userId: string): Promise<string | null> {
  const { data } = await admin.auth.admin.getUserById(userId);
  return data.user?.email || null;
}

// Vercel Cron (see vercel.json) hits this daily. Runs once/day, so checking
// for an exact days-remaining match against each threshold naturally fires
// each alert once per denial — no separate "already alerted" tracking needed.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await createAdminClient();
  const { data: denials } = await admin
    .from("claim_denials")
    .select("id, practice_id, claim_number, denial_reason_code, appeal_deadline, assigned_to, status")
    .in("status", ["open", "appeal_filed"])
    .not("appeal_deadline", "is", null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let alertsSent = 0;

  for (const denial of denials || []) {
    const deadline = new Date(denial.appeal_deadline!);
    deadline.setHours(0, 0, 0, 0);
    const daysRemaining = Math.round((deadline.getTime() - today.getTime()) / 86400000);

    if (!ALERT_THRESHOLDS.includes(daysRemaining)) continue;

    const label = denial.claim_number || "(no claim number)";
    const message =
      daysRemaining === 0
        ? `Appeal deadline today for ${label} (${denial.denial_reason_code}).`
        : `${daysRemaining} days left to appeal ${label} (${denial.denial_reason_code}).`;
    const link = `/dashboard/appeals/${denial.id}`;

    let recipientIds: string[] = [];
    if (denial.assigned_to) {
      recipientIds = [denial.assigned_to];
    } else {
      const { data: admins } = await admin
        .from("profiles")
        .select("id")
        .eq("practice_id", denial.practice_id)
        .eq("role", "clinic_admin");
      recipientIds = (admins || []).map((a) => a.id);
    }

    for (const userId of recipientIds) {
      const email = await getEmail(admin, userId);
      await notify({
        userId,
        email,
        type: "appeal_deadline",
        message,
        link,
        emailSubject: `Appeal deadline alert: ${label}`,
        emailHtml: `<p>${message}</p><p><a href="${process.env.NEXT_PUBLIC_SITE_URL}${link}">View denial →</a></p>`,
      });
      alertsSent++;
    }
  }

  return NextResponse.json({ checked: denials?.length || 0, alertsSent });
}
