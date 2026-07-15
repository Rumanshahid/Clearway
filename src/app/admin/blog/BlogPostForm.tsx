"use client";

import { useState } from "react";
import { renderMarkdown } from "@/lib/blog";
import type { BlogPostStatus } from "@/lib/database.types";

export interface EditablePost {
  id?: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  tags: string[];
  status: BlogPostStatus;
  seo_title: string | null;
  seo_description: string | null;
}

export default function BlogPostForm({
  post,
  action,
}: {
  post: EditablePost;
  action: (formData: FormData) => void;
}) {
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [slugTouched, setSlugTouched] = useState(!!post.id);
  const [content, setContent] = useState(post.content);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) {
      setSlug(
        value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
      );
    }
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      {post.id && <input type="hidden" name="post_id" value={post.id} />}

      <section className="card p-6">
        <h2 className="text-[15px] font-semibold mb-4">Post details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="title">Title *</label>
            <input
              className="input"
              id="title"
              name="title"
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="slug">Slug</label>
            <input
              className="input"
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              placeholder="auto-generated-from-title"
            />
            <p className="text-[12px] text-gray-400 mt-1">Shown in the URL: /blog/{slug || "…"}</p>
          </div>
          <div>
            <label className="label" htmlFor="status">Status</label>
            <select className="input" id="status" name="status" defaultValue={post.status}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="excerpt">Excerpt</label>
            <textarea
              className="input"
              id="excerpt"
              name="excerpt"
              rows={2}
              defaultValue={post.excerpt || ""}
              placeholder="Shown on the blog list page. Leave blank to auto-generate from the content."
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="tags">Tags (comma separated)</label>
            <input className="input" id="tags" name="tags" defaultValue={post.tags.join(", ")} placeholder="Prior Auth, Product Updates" />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="cover_image">Cover image</label>
            {(coverPreview || post.cover_image_url) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverPreview || post.cover_image_url!} alt="" className="w-full max-h-[220px] object-cover rounded-lg mb-2" />
            )}
            <input
              className="input"
              id="cover_image"
              name="cover_image"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setCoverPreview(file ? URL.createObjectURL(file) : null);
              }}
            />
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-[15px] font-semibold mb-1">Content</h2>
        <p className="text-[12.5px] text-gray-400 mb-4">Markdown — headings (#), bold (**text**), links ([text](url)), images (![alt](url)).</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <textarea
            className="input font-mono text-[13px]"
            name="content"
            rows={20}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="# Your post title&#10;&#10;Start writing…"
          />
          <div className="rounded-lg px-4 py-3 overflow-y-auto" style={{ border: "1px solid var(--gray-200)", maxHeight: "520px" }}>
            <div className="label mb-2">Preview</div>
            {content.trim() ? (
              <div className="blog-preview" dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
            ) : (
              <p className="text-[13px] text-gray-400">Nothing to preview yet.</p>
            )}
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-[15px] font-semibold mb-1">SEO</h2>
        <p className="text-[12.5px] text-gray-400 mb-4">Optional — falls back to the post title/excerpt if left blank.</p>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="label" htmlFor="seo_title">SEO title</label>
            <input className="input" id="seo_title" name="seo_title" defaultValue={post.seo_title || ""} />
          </div>
          <div>
            <label className="label" htmlFor="seo_description">SEO description</label>
            <textarea className="input" id="seo_description" name="seo_description" rows={2} defaultValue={post.seo_description || ""} />
          </div>
        </div>
      </section>

      <button type="submit" className="btn btn-primary self-start">
        {post.id ? "Save changes" : "Create post"}
      </button>
    </form>
  );
}
