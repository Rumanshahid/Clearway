"use client";

import { useState } from "react";

function parse24(hhmm: string | undefined | null) {
  if (!hhmm) return null;
  const [hStr, mStr] = hhmm.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const meridiem: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, minute: m, meridiem };
}

function to24(hour12: number, minute: number, meridiem: "AM" | "PM") {
  let h = hour12 % 12;
  if (meridiem === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function wrap(n: number, min: number, max: number) {
  const range = max - min + 1;
  return ((((n - min) % range) + range) % range) + min;
}

// Spinner: type a number directly, click the up/down arrows, or scroll the
// mouse wheel over it — all three set the value, wrapping at min/max.
function Segment({
  value,
  min,
  max,
  ariaLabel,
  onSet,
}: {
  value: number;
  min: number;
  max: number;
  ariaLabel: string;
  onSet: (next: number) => void;
}) {
  return (
    <div className="flex items-stretch">
      <input
        className="input text-center"
        style={{ width: 44, padding: "10px 4px", borderRadius: "9px 0 0 9px" }}
        inputMode="numeric"
        aria-label={ariaLabel}
        value={String(value).padStart(2, "0")}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "").slice(-2);
          if (digits === "") return;
          onSet(wrap(parseInt(digits, 10), min, max));
        }}
        onWheel={(e) => {
          e.preventDefault();
          onSet(wrap(value + (e.deltaY < 0 ? 1 : -1), min, max));
        }}
      />
      <div className="flex flex-col" style={{ borderRadius: "0 9px 9px 0", overflow: "hidden" }}>
        <button
          type="button"
          className="flex items-center justify-center flex-1"
          style={{ width: 20, background: "var(--gray-100)", borderBottom: "1px solid var(--gray-200)" }}
          aria-label={`Increase ${ariaLabel}`}
          onClick={() => onSet(wrap(value + 1, min, max))}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 5.5L4 2.5L7 5.5" stroke="var(--gray-600)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button
          type="button"
          className="flex items-center justify-center flex-1"
          style={{ width: 20, background: "var(--gray-100)" }}
          aria-label={`Decrease ${ariaLabel}`}
          onClick={() => onSet(wrap(value - 1, min, max))}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 2.5L4 5.5L7 2.5" stroke="var(--gray-600)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
    </div>
  );
}

export default function TimeInput({
  id,
  name,
  value,
  defaultValue,
  onChange,
}: {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value24: string) => void;
}) {
  const initial = parse24(value ?? defaultValue);
  const [hour12, setHour12] = useState(initial?.hour12 ?? 12);
  const [minute, setMinute] = useState(initial?.minute ?? 0);
  // Defaults to AM whenever no existing value was supplied — the whole
  // point being a fresh time field never silently starts on PM.
  const [meridiem, setMeridiem] = useState<"AM" | "PM">(initial?.meridiem ?? "AM");
  const [touched, setTouched] = useState(!!initial);

  function commit(h: number, m: number, mer: "AM" | "PM") {
    setTouched(true);
    if (onChange) onChange(to24(h, m, mer));
  }

  return (
    <div id={id} className="flex items-center gap-2">
      <Segment
        value={hour12}
        min={1}
        max={12}
        ariaLabel="Hour"
        onSet={(next) => {
          setHour12(next);
          commit(next, minute, meridiem);
        }}
      />
      <span className="text-gray-400 font-semibold">:</span>
      <Segment
        value={minute}
        min={0}
        max={59}
        ariaLabel="Minute"
        onSet={(next) => {
          setMinute(next);
          commit(hour12, next, meridiem);
        }}
      />
      <button
        type="button"
        className="btn btn-outline btn-sm"
        style={{ padding: "8px 10px" }}
        onClick={() => {
          const next = meridiem === "AM" ? "PM" : "AM";
          setMeridiem(next);
          commit(hour12, minute, next);
        }}
      >
        {meridiem}
      </button>
      {name && <input type="hidden" name={name} value={touched ? to24(hour12, minute, meridiem) : ""} />}
    </div>
  );
}
