import { BlogPostContent } from "@/app/blog/[slug]/page";

export { generateMetadata } from "@/app/blog/[slug]/page";

export default async function PatientBlogPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;
  return <BlogPostContent slug={slug} error={error} basePath="/patient/blog" showChrome={false} />;
}
