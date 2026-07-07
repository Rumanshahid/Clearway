"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { upsertSiteContent } from "@/lib/criteria-repo";
import { allFieldKeys, allVisibilityKeys, getPageBySlug } from "@/lib/content-schema";

// Generic across every page in the schema — the allowed field/visibility
// keys for a save are looked up from the page the form says it's for, so a
// request can never write a key that page's schema doesn't declare.
export async function saveSiteContentAction(formData: FormData) {
  const slug = String(formData.get("_page") || "");
  const page = getPageBySlug(slug);
  if (!page) redirect("/admin/content");

  const fieldKeys = allFieldKeys(page);
  const visibilityKeys = allVisibilityKeys(page);

  const writes = [
    ...fieldKeys.filter((key) => formData.get(key) !== null).map((key) => upsertSiteContent(key, String(formData.get(key)), true)),
    ...visibilityKeys.map((key) => upsertSiteContent(key, "", formData.get(`visible_${key}`) === "on")),
  ];
  await Promise.all(writes);

  revalidatePath(`/admin/content/${slug}`);
  const paths = page.revalidatePaths ?? [slug === "home" ? "/" : `/${slug}`];
  for (const p of paths) revalidatePath(p);
}
