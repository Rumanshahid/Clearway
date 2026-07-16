import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

// Posts are now authorable by any signed-in staff or patient account, not
// just a single trusted super_admin (see 0040_blog_social.sql) -- so the
// rendered HTML is untrusted and must be sanitized before it's ever put in
// the DOM via dangerouslySetInnerHTML.
marked.setOptions({ breaks: true });

// CommonMark (what `marked` follows) requires a space after the #'s for a
// heading -- "#Title" with no space is valid Markdown for a literal
// paragraph starting with "#", not a heading. That's an easy typo to make
// (or for an LLM to produce) and a confusing one to debug, since it fails
// silently rather than erroring, so fix it up before parsing rather than
// relying on every piece of content being typed perfectly.
function fixHeadingSpacing(content: string): string {
  return content.replace(/^(#{1,6})([^#\s])/gm, "$1 $2");
}

export function renderMarkdown(content: string): string {
  const html = marked.parse(fixHeadingSpacing(content), { async: false }) as string;
  return DOMPurify.sanitize(html);
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// A short, plain-text preview for the blog list page when no excerpt was
// written by hand -- strips Markdown syntax rather than rendering to HTML
// and stripping tags, so it stays readable even mid-sentence.
export function excerptFrom(content: string, maxLength = 180): string {
  const plain = content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/[#>*_`~-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > maxLength ? `${plain.slice(0, maxLength).trimEnd()}…` : plain;
}
