"use server";

import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { WIDGET_REGISTRY, type DashboardLayout } from "@/lib/dashboardWidgets";

const VALID_KEYS = new Set(WIDGET_REGISTRY.map((w) => w.key));

export async function updateDashboardLayoutAction(formData: FormData) {
  const session = await getSessionProfile();
  const supabase = await createClient();

  let parsed: Partial<DashboardLayout> = {};
  try {
    parsed = JSON.parse(String(formData.get("layout") || "{}"));
  } catch {
    redirect(`/dashboard/overview?error=${encodeURIComponent("Could not save layout.")}`);
  }

  const layout: DashboardLayout = {
    order: Array.isArray(parsed.order) ? parsed.order.filter((k): k is string => typeof k === "string" && VALID_KEYS.has(k)) : [],
    hidden: Array.isArray(parsed.hidden) ? parsed.hidden.filter((k): k is string => typeof k === "string" && VALID_KEYS.has(k)) : [],
  };

  await supabase.from("profiles").update({ dashboard_layout: layout }).eq("id", session.userId);

  redirect("/dashboard/overview");
}
