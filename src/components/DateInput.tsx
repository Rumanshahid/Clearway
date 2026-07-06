"use client";

import { useState } from "react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Fast entry: type digits only (ddmmyy or ddmmyyyy, no separators needed)
// and it resolves to a real date as you go — e.g. "070326" -> 7 March 2026.
// Parses the ISO string manually (no Date object, no toLocale*) so the
// confirmation label can never disagree between server and client render —
// the same hydration-mismatch trap fixed elsewhere in this app.
function isoToDisplay(iso: string | undefined | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
}

function isoToLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "";
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function digitsToIso(digits: string): string | null {
  if (digits.length !== 6 && digits.length !== 8) return null;
  const day = parseInt(digits.slice(0, 2), 10);
  const month = parseInt(digits.slice(2, 4), 10);
  const yearDigits = digits.slice(4);
  const year = yearDigits.length === 2 ? 2000 + parseInt(yearDigits, 10) : parseInt(yearDigits, 10);
  if (month < 1 || month > 12) return null;
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDigitsForDisplay(digits: string): string {
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean);
  return parts.join("/");
}

export default function DateInput({
  id,
  name,
  value,
  defaultValue,
  onChange,
  required,
  placeholder,
}: {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (isoValue: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  const [display, setDisplay] = useState(() => isoToDisplay(value ?? defaultValue));
  const [iso, setIso] = useState(() => value ?? defaultValue ?? "");

  // Controlled usage (e.g. a filter bar reading its value from the URL, or
  // the EOB parser auto-filling a denial date) — adjust local state when
  // the parent's `value` changes, following React's documented pattern for
  // this (https://react.dev/learn/you-might-not-need-an-effect#adjusting-
  // some-state-when-a-prop-changes) rather than a useEffect, which would
  // cause an extra render on every external update.
  const [prevValue, setPrevValue] = useState(value);
  if (value !== undefined && value !== prevValue) {
    setPrevValue(value);
    setIso(value);
    setDisplay(isoToDisplay(value));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
    setDisplay(formatDigitsForDisplay(digits));

    const parsed = digitsToIso(digits);
    // A partially-typed value like "070" isn't empty, so the native
    // `required` check alone would let it through — mark the field
    // invalid until the digits actually resolve to a real date.
    e.target.setCustomValidity(digits.length > 0 && !parsed ? "Enter a valid date as ddmmyy" : "");
    const next = parsed || "";
    setIso(next);
    if (onChange) onChange(next);
  }

  const label = iso ? isoToLabel(iso) : "";

  return (
    <div>
      <input
        className="input"
        id={id}
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder || "ddmmyy, e.g. 070326"}
        value={display}
        onChange={handleChange}
        required={required && !iso}
      />
      {name && <input type="hidden" name={name} value={iso} />}
      <p className="text-[11.5px] mt-1" style={{ color: label ? "var(--indigo-600)" : "var(--gray-400)" }}>
        {label || "Type the date as ddmmyy — no slashes needed"}
      </p>
    </div>
  );
}
