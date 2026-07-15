import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminBlogListPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, title, slug, status, tags, published_at, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <div className="max-w-[900px] mx-auto py-8 px-5">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px] font-semibold">Blog</h1>
        <Link href="/admin/blog/new" className="btn btn-primary">+ New post</Link>
      </div>

      <div className="card overflow-hidden overflow-x-auto">
        <table className="w-full text-[13.5px]">
          <thead>
            <tr className="text-left text-gray-400 text-[11px] uppercase tracking-wide" style={{ borderBottom: "1px solid var(--gray-200)" }}>
              <th className="px-5 py-3 font-semibold">Title</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Tags</th>
              <th className="px-5 py-3 font-semibold">Last updated</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(posts || []).map((p) => (
              <tr key={p.id} style={{ borderBottom: "1px solid var(--gray-200)" }}>
                <td className="px-5 py-3 font-medium">{p.title}</td>
                <td className="px-5 py-3">
                  <span
                    className="status-pill"
                    style={
                      p.status === "published"
                        ? { background: "var(--success-bg)", color: "var(--success-green)" }
                        : { background: "var(--gray-100)", color: "var(--gray-400)" }
                    }
                  >
                    {p.status === "published" ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-400">{p.tags.join(", ") || "—"}</td>
                <td className="px-5 py-3 text-gray-400">{new Date(p.updated_at).toLocaleDateString()}</td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/admin/blog/${p.id}`} className="text-indigo-600 font-medium">Edit →</Link>
                </td>
              </tr>
            ))}
            {(!posts || posts.length === 0) && (
              <tr>
                <td className="px-5 py-10 text-center text-gray-400" colSpan={5}>
                  No posts yet. <Link href="/admin/blog/new" className="text-indigo-600">Write your first one →</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
