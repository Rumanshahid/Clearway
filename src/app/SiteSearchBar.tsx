// Plain GET-form search bar for the top of a page (home, blog, Q&A) -- a
// single fully-rounded input, no separate icon/button. Pressing Enter
// submits it (a form with exactly one text input submits on Enter with no
// JS needed). Faded until hovered/focused so it doesn't compete with the
// page's primary content at rest.
export default function SiteSearchBar({ placeholder = "Search asaanbil.com…" }: { placeholder?: string }) {
  return (
    <form action="/search" method="GET" className="w-full max-w-[420px] mx-auto">
      <input
        className="site-search-input"
        type="search"
        name="q"
        placeholder={placeholder}
        aria-label="Search"
      />
    </form>
  );
}
