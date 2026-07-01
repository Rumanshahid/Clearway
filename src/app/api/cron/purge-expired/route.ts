import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Vercel Cron (see vercel.json) hits this daily with an
// `Authorization: Bearer ${CRON_SECRET}` header. Purges pa_requests (and,
// via cascade, their letters) once they're older than the owning practice's
// configured retention_months. Access log rows are intentionally untouched —
// the audit trail should outlive the data it describes.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createAdminClient();
  const { data: practices } = await supabase.from("practices").select("id, retention_months");

  let totalDeleted = 0;
  const results: { practiceId: string; deleted: number }[] = [];

  for (const practice of practices || []) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - practice.retention_months);

    const { data: deleted } = await supabase
      .from("pa_requests")
      .delete()
      .eq("practice_id", practice.id)
      .lt("created_at", cutoff.toISOString())
      .select("id");

    const count = deleted?.length || 0;
    totalDeleted += count;
    if (count > 0) results.push({ practiceId: practice.id, deleted: count });
  }

  return NextResponse.json({ totalDeleted, results });
}
