"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { activatePromptTemplateVersion, createPromptTemplateVersion } from "@/lib/criteria-repo";

export async function saveTemplateVersionAction(formData: FormData) {
  const content = String(formData.get("content") || "").trim();
  if (!content) {
    redirect(`/admin/prompt?error=${encodeURIComponent("Template content can't be empty.")}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  await createPromptTemplateVersion(content, user.id);
  revalidatePath("/admin/prompt");
  redirect("/admin/prompt");
}

export async function activateVersionAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  await activatePromptTemplateVersion(id);
  revalidatePath("/admin/prompt");
}
