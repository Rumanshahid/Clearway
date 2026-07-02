"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

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
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const current = { status, payer, procedure, from, to };

  function applyFilter(key: keyof typeof current, value: string) {
    const params = new URLSearchParams();
    const next = { ...current, [key]: value };
    Object.entries(next).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    router.push(`/dashboard${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function scheduleClose() {
    closeTimeout.current = setTimeout(() => setOpen(false), 150);
  }
  function cancelClose() {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
  }

  const labelFor = (options: [string, string][], value?: string) => options.find(([v]) => v === value)?.[1];

  const chips: { key: keyof typeof current; label: string }[] = [];
  if (status) chips.push({ key: "status", label: `Status: ${labelFor(statusOptions, status) || status}` });
  if (payer) chips.push({ key: "payer", label: `Payer: ${labelFor(payerOptions, payer) || payer}` });
  if (procedure) chips.push({ key: "procedure", label: `Procedure: ${labelFor(procedureOptions, procedure) || procedure}` });
  if (from) chips.push({ key: "from", label: `From: ${from}` });
  if (to) chips.push({ key: "to", label: `To: ${to}` });

  return (
    <div className="mb-6">
      <div className="relative inline-block" onMouseEnter={cancelClose} onMouseLeave={scheduleClose}>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen((v) => !v)}>
          Filters {chips.length > 0 && `(${chips.length})`} ▾
        </button>

        <div className={`dropdown-panel absolute left-0 top-11 w-[280px] card p-4 z-30 flex flex-col gap-4${open ? " open" : ""}`}>
          <div>
            <label className="label" htmlFor="filter-status">Status</label>
            <select
              className="input"
              id="filter-status"
              value={status || ""}
              onChange={(e) => applyFilter("status", e.target.value)}
            >
              <option value="">All</option>
              {statusOptions.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="filter-payer">Payer</label>
            <select
              className="input"
              id="filter-payer"
              value={payer || ""}
              onChange={(e) => applyFilter("payer", e.target.value)}
            >
              <option value="">All</option>
              {payerOptions.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="filter-procedure">Procedure</label>
            <select
              className="input"
              id="filter-procedure"
              value={procedure || ""}
              onChange={(e) => applyFilter("procedure", e.target.value)}
            >
              <option value="">All</option>
              {procedureOptions.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="filter-from">From</label>
            <input
              className="input"
              type="date"
              id="filter-from"
              value={from || ""}
              onChange={(e) => applyFilter("from", e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="filter-to">To</label>
            <input
              className="input"
              type="date"
              id="filter-to"
              value={to || ""}
              onChange={(e) => applyFilter("to", e.target.value)}
            />
          </div>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-3">
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
  );
}
