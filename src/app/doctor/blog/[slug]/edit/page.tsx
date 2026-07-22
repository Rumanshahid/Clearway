import { EditBlogPostContent } from "@/app/blog/[slug]/edit/page";

export default async function DoctorEditBlogPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;
  return <EditBlogPostContent slug={slug} error={error} basePath="/doctor/blog" showChrome={false} />;
}
