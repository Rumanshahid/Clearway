import Link from "next/link";

export interface SuggestionItem {
  slug: string;
  title: string;
}

export default function SuggestionsSidebar({ posts, basePath = "/blog" }: { posts: SuggestionItem[]; basePath?: string }) {
  if (posts.length === 0) return null;

  return (
    <aside className="w-[230px] flex-shrink-0">
      <div className="card p-4">
        <h2 className="text-[13px] font-semibold text-gray-900 mb-3">Suggested reading</h2>
        <div className="flex flex-col gap-2.5">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`${basePath}/${post.slug}`}
              className="text-[13.5px] text-gray-700 leading-snug hover:text-indigo-600 transition-colors"
            >
              {post.title}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
