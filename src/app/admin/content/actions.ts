"use server";

import { revalidatePath } from "next/cache";
import { upsertSiteContent } from "@/lib/criteria-repo";

const CONTENT_KEYS = [
  "hero_headline",
  "hero_subheadline",
  "hero_cta_primary",
  "stat1_number",
  "stat1_label",
  "stat1_copy",
  "stat2_number",
  "stat2_label",
  "stat2_copy",
  "stat3_number",
  "stat3_label",
  "stat3_copy",
  "pricing_pilot_price",
  "pricing_practice_price",
  "pricing_multisite_price",
  "cta_final_headline",
  "cta_final_copy",
];

const SECTION_KEYS = ["section_stats", "section_insurers", "section_compare", "section_pricing"];

export async function saveSiteContentAction(formData: FormData) {
  const writes = [
    ...CONTENT_KEYS.filter((key) => formData.get(key) !== null).map((key) =>
      upsertSiteContent(key, String(formData.get(key)), true)
    ),
    ...SECTION_KEYS.map((key) => upsertSiteContent(key, "", formData.get(`visible_${key}`) === "on")),
  ];
  await Promise.all(writes);

  revalidatePath("/admin/content");
  revalidatePath("/");
}
