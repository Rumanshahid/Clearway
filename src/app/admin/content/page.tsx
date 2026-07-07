import { redirect } from "next/navigation";
import { CONTENT_PAGES } from "@/lib/content-schema";

export default function AdminContentIndexPage() {
  redirect(`/admin/content/${CONTENT_PAGES[0].slug}`);
}
