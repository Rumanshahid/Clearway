import { BlogListContent } from "@/app/blog/page";

export const metadata = {
  title: "Blog — asaanbil.com",
  description: "Notes on prior authorization, claims, and running a specialty practice — from our team, physicians, and patients.",
};

// Renders the same list as /blog but inside the staff dashboard chrome
// (DashboardNavBar via layout.tsx here) instead of the marketing SiteNav --
// a signed-in doctor clicking "Blog" from their own dashboard should stay
// inside the dashboard shell. basePath="/doctor/blog" so post, write, and
// edit links stay under the dashboard prefix too -- see
// doctor/blog/[slug]/page.tsx, doctor/blog/[slug]/edit/page.tsx, and
// doctor/blog/new/page.tsx, which mirror the corresponding /blog/... routes.
export default async function DoctorBlogListPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; author_type?: string }>;
}) {
  return <BlogListContent searchParams={searchParams} basePath="/doctor/blog" showChrome={false} showHeading={false} />;
}
