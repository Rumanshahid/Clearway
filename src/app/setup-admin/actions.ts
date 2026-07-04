"use server";

import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function bootstrapAdminAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const secret = String(formData.get("secret") || "").trim();
  const expected = process.env.ADMIN_SETUP_SECRET;

  if (!expected) {
    redirect(`/setup-admin?error=${encodeURIComponent("ADMIN_SETUP_SECRET isn't configured on the server yet.")}`);
  }

  if (secret !== expected) {
    redirect(`/setup-admin?error=${encodeURIComponent("Incorrect setup key.")}`);
  }

  const admin = await createAdminClient();

  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "super_admin");

  if (count && count > 0) {
    redirect(`/setup-admin?error=${encodeURIComponent("An admin already exists — ask them for access instead of using this page.")}`);
  }

  const { error } = await admin.from("profiles").update({ role: "super_admin" }).eq("id", user.id);
  if (error) {
    redirect(`/setup-admin?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/admin");
}
