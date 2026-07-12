"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
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

  const { error } = await supabase.from("profiles").update({ dashboard_layout: layout }).eq("id", session.userId);

  // Forces a fresh render of the page (and every nested Client Component,
  // resetting the Customize modal's local state) instead of risking a
  // cached RSC payload getting served for a redirect target the router
  // has already visited -- e.g. two failed saves in a row would otherwise
  // land on the exact same URL.
  revalidatePath("/dashboard/overview");

  if (error) {
    redirect(`/dashboard/overview?error=${encodeURIComponent(`Could not save layout: ${error.message}`)}`);
  }

  redirect("/dashboard/overview?saved=1");
}
