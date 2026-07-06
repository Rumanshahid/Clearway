"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import DateInput from "@/components/DateInput";

interface FiltersDropdownProps {
  status?: string;
  payer?: string;
  procedure?: string;
  from?: string;
  to?: string;
  statusOptions: [string, string][];
  payerOptions: [string, string][];
  procedureOptions: [string, string][];
}

export default function FiltersDropdown({
  status,
  payer,
  procedure,
  from,
  to,
  statusOptions,
  payerOptions,
  procedureOptions,
}: FiltersDropdownProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const current = { status, payer, procedure, from, to };
  const activeCount = Object.values(current).filter(Boolean).length;

  function applyFilter(key: keyof typeof current, value: string) {
    const params = new URLSearchParams();
    const next = { ...current, [key]: value };
    Object.entries(next).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    router.push(`/dashboard${params.toString() ? `?${params.toString()}` : ""}`);
  }

  const labelFor = (options: [string, string][], value?: string) => options.find(([v]) => v === value)?.[1];

  const chips: { key: keyof typeof current; label: string }[] = [];
  if (status) chips.push({ key: "status", label: `Status: ${labelFor(statusOptions, status) || status}` });
  if (payer) chips.push({ key: "payer", label: `Payer: ${labelFor(payerOptions, payer) || payer}` });
  if (procedure) chips.push({ key: "procedure", label: `Procedure: ${labelFor(procedureOptions, procedure) || procedure}` });
  if (from) chips.push({ key: "from", label: `From: ${from}` });
  if (to) chips.push({ key: "to", label: `To: ${to}` });

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
                <label className="label" htmlFor="filter-status">Status</label>
                <select className="input" id="filter-status" value={status || ""} onChange={(e) => applyFilter("status", e.target.value)}>
                  <option value="">All</option>
                  {statusOptions.map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="filter-payer">Payer</label>
                <select className="input" id="filter-payer" value={payer || ""} onChange={(e) => applyFilter("payer", e.target.value)}>
                  <option value="">All</option>
                  {payerOptions.map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="filter-procedure">Procedure</label>
                <select className="input" id="filter-procedure" value={procedure || ""} onChange={(e) => applyFilter("procedure", e.target.value)}>
                  <option value="">All</option>
                  {procedureOptions.map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="filter-from">From</label>
                <DateInput id="filter-from" value={from || ""} onChange={(v) => applyFilter("from", v)} />
              </div>
              <div>
                <label className="label" htmlFor="filter-to">To</label>
                <DateInput id="filter-to" value={to || ""} onChange={(v) => applyFilter("to", v)} />
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
            <button type="button" className="text-btn text-[12.5px] text-gray-400" onClick={() => router.push("/dashboard")}>
              Clear filters
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
