import BlogPostForm from "../BlogPostForm";
import { createPostAction } from "../actions";

export default async function NewBlogPostPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="max-w-[900px] mx-auto py-8 px-5">
      <h1 className="text-[24px] font-semibold mb-6">New post</h1>

      {error && (
        <div className="mb-5 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
          {error}
        </div>
      )}

      <BlogPostForm
        post={{
          title: "",
          slug: "",
          excerpt: null,
          content: "",
          cover_image_url: null,
          tags: [],
          status: "draft",
          seo_title: null,
          seo_description: null,
        }}
        action={createPostAction}
      />
    </div>
  );
}
