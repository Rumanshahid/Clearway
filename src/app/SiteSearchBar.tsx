// Plain GET-form search bar for the top of a page (home, blog, Q&A) --
// no client JS needed since a form submit is all this does; the animated
// icon-to-input version in the nav (NavSearch.tsx) is the one that needs
// interactivity.
export default function SiteSearchBar({ placeholder = "Search asaanbil.com…" }: { placeholder?: string }) {
  return (
    <form action="/search" method="GET" className="flex gap-2 w-full max-w-[420px]">
      <input className="input" type="search" name="q" placeholder={placeholder} aria-label="Search" />
      <button type="submit" className="btn btn-outline flex-shrink-0" aria-label="Search">
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <circle cx="6.5" cy="6.5" r="4.5" stroke="var(--gray-600)" strokeWidth="1.4" />
          <path d="M10 10l3.5 3.5" stroke="var(--gray-600)" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
    </form>
  );
}
