import { BlogListContent } from "@/app/blog/page";

export const metadata = {
  title: "Blog — asaanbil.com",
  description: "Notes on prior authorization, claims, and running a specialty practice — from our team, physicians, and patients.",
};

// Renders the same list as /blog but inside the staff dashboard chrome
// (DashboardNavBar via layout.tsx here) instead of the marketing SiteNav --
// a signed-in doctor clicking "Blog" from their own dashboard should stay
// inside the dashboard shell. Deliberately NOT passing a custom basePath --
// individual post, write, and edit links inside BlogListContent still
// resolve to their existing working /blog/... routes rather than requiring
// a full parallel mirror of the authoring/editing flow under
// /doctor/blog/....
export default async function DoctorBlogListPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; author_type?: string; sort?: string }>;
}) {
  return <BlogListContent searchParams={searchParams} showChrome={false} showHeading={false} />;
}
