import { BlogListContent } from "@/app/blog/page";

export const metadata = {
  title: "Blog — asaanbil.com",
  description: "Notes on prior authorization, claims, and running a specialty practice — from our team, physicians, and patients.",
};

export default async function PatientBlogListPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; author_type?: string }>;
}) {
  return <BlogListContent searchParams={searchParams} basePath="/patient/blog" showChrome={false} showHeading={false} />;
}
