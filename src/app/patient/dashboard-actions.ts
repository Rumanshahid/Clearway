"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updatePatientDashboardLayoutAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const hidden = String(formData.get("hidden") || "[]");
  let hiddenSections: string[] = [];
  try {
    hiddenSections = JSON.parse(hidden);
  } catch {
    hiddenSections = [];
  }

  await supabase.from("patient_accounts").update({ dashboard_hidden_sections: hiddenSections }).eq("id", user.id);
  revalidatePath("/patient/profile");
}
