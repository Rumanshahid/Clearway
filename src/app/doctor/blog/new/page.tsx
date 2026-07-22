import { NewBlogPostContent } from "@/app/blog/new/page";

export { metadata } from "@/app/blog/new/page";

export default async function DoctorNewBlogPostPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return <NewBlogPostContent error={error} basePath="/doctor/blog" showChrome={false} />;
}
