"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface FiltersSidebarProps {
  tag?: string;
  authorType?: string;
  sort?: string;
  tagOptions: string[];
}

export default function FiltersSidebar({ tag, authorType, sort, tagOptions }: FiltersSidebarProps) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  const current = { tag, author_type: authorType, sort };
  const activeCount = Object.values(current).filter(Boolean).length;

  function applyFilter(key: keyof typeof current, value: string) {
    const params = new URLSearchParams();
    const next = { ...current, [key]: value };
    Object.entries(next).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    router.push(`/questions${params.toString() ? `?${params.toString()}` : ""}`);
  }

  const chips: { key: keyof typeof current; label: string }[] = [];
  if (tag) chips.push({ key: "tag", label: `Tag: ${tag}` });
  if (authorType) chips.push({ key: "author_type", label: `Author: ${authorType === "patient" ? "Patients" : "Doctors & Staff"}` });
  if (sort) chips.push({ key: "sort", label: `Sort: ${sort === "top" ? "Top voted" : "Newest"}` });

  return (
    <aside className="w-[230px] flex-shrink-0">
      <div className="card p-4">
        <button
          type="button"
          className="flex items-center justify-between w-full text-[13px] font-semibold text-gray-900"
          onClick={() => setOpen((v) => !v)}
        >
          <span>Filters {activeCount > 0 && `(${activeCount})`}</span>
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.28s cubic-bezier(0.16,1,0.3,1)" }}
          >
            <path d="M2.5 4.5L6 8l3.5-3.5" stroke="var(--gray-600)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className={`collapse-panel${open ? " open" : ""}`}>
          <div>
            <div className="flex flex-col gap-4 pt-4">
              <div>
                <label className="label" htmlFor="filter-sort">Sort by</label>
                <select className="input" id="filter-sort" value={sort || ""} onChange={(e) => applyFilter("sort", e.target.value)}>
                  <option value="">Newest</option>
                  <option value="top">Top voted</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="filter-author-type">Asked by</label>
                <select className="input" id="filter-author-type" value={authorType || ""} onChange={(e) => applyFilter("author_type", e.target.value)}>
                  <option value="">Everyone</option>
                  <option value="staff">Doctors &amp; Staff</option>
                  <option value="patient">Patients</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="filter-tag">Tag</label>
                <select className="input" id="filter-tag" value={tag || ""} onChange={(e) => applyFilter("tag", e.target.value)}>
                  <option value="">All</option>
                  {tagOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {chips.length > 0 && (
          <div className="flex flex-col items-start gap-2 mt-4 pt-4" style={{ borderTop: "1px solid var(--gray-200)" }}>
            {chips.map((chip) => (
              <span key={chip.key} className="status-pill" style={{ background: "var(--gray-100)", color: "var(--gray-600)" }}>
                {chip.label}
              </span>
            ))}
            <button type="button" className="text-btn text-[12.5px] text-gray-400" onClick={() => router.push("/questions")}>
              Clear filters
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
