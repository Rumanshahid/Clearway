"use client";

const OPTIONS: { value: "draft" | "submitted"; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
];

// Purely presentational/controlled -- the parent (row or detail page) owns
// the value and submits the update, so the same state can also drive a
// status dot rendered elsewhere in the layout without the two drifting out
// of sync.
export default function PatientPaStatusSelect({
  value,
  onChange,
}: {
  value: "draft" | "submitted";
  onChange: (next: "draft" | "submitted") => void;
}) {
  return (
    <select
      className="input"
      value={value}
      onChange={(e) => onChange(e.target.value as "draft" | "submitted")}
      style={{ padding: "5px 8px", fontSize: "12.5px", width: "auto" }}
      onClick={(e) => e.stopPropagation()}
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
