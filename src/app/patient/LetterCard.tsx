"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import type { PatientLetterRiskFlag } from "@/lib/database.types";

const RISK_STYLE: Record<PatientLetterRiskFlag["severity"], { bg: string; color: string; label: string }> = {
  high: { bg: "var(--danger-bg)", color: "var(--danger-red)", label: "High" },
  medium: { bg: "var(--amber-bg)", color: "var(--amber)", label: "Medium" },
  low: { bg: "var(--gray-100)", color: "var(--gray-600)", label: "Low" },
};

function SubmitButton({ label, pendingLabel, outline = true }: { label: string; pendingLabel: string; outline?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={outline ? "btn btn-outline btn-sm" : "btn btn-primary btn-sm"} disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}

export default function LetterCard({
  requestId,
  letterContent,
  riskFlags,
  suggestions,
  draftAction,
  editAction,
}: {
  requestId: string;
  letterContent: string | null;
  riskFlags: PatientLetterRiskFlag[];
  suggestions: string[];
  draftAction: (formData: FormData) => void | Promise<void>;
  editAction: (formData: FormData) => void | Promise<void>;
}) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState(letterContent || "");

  if (!letterContent) {
    return (
      <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--gray-200)" }}>
        <form action={draftAction}>
          <input type="hidden" name="request_id" value={requestId} />
          <SubmitButton label="Draft letter" pendingLabel="Drafting…" />
        </form>
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--gray-200)" }}>
      {riskFlags.length > 0 && (
        <div className="flex flex-col gap-1.5 mb-3">
          {riskFlags.map((flag, i) => (
            <div key={i} className="text-[12px] rounded-lg px-2.5 py-1.5 flex items-start gap-2" style={{ background: RISK_STYLE[flag.severity].bg, color: RISK_STYLE[flag.severity].color }}>
              <span className="font-semibold flex-shrink-0">{RISK_STYLE[flag.severity].label} risk:</span>
              <span>{flag.message}</span>
            </div>
          ))}
        </div>
      )}

      {editing ? (
        <form
          action={async (formData) => {
            formData.set("letter_content", draftText);
            await editAction(formData);
            setEditing(false);
          }}
          className="flex flex-col gap-2 mb-2"
        >
          <input type="hidden" name="request_id" value={requestId} />
          <textarea
            className="input font-sans text-[12.5px] leading-relaxed"
            rows={16}
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
          />
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary btn-sm">Save changes</button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                setDraftText(letterContent);
                setEditing(false);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <pre className="text-[12.5px] text-gray-700 whitespace-pre-wrap mb-2" style={{ fontFamily: "inherit" }}>
          {letterContent}
        </pre>
      )}

      {suggestions.length > 0 && !editing && (
        <div className="text-[12px] rounded-lg px-3 py-2 mb-2" style={{ background: "var(--gray-50)", color: "var(--gray-600)" }}>
          <strong className="text-gray-900">Before you send it:</strong>
          <ul className="list-disc pl-4 mt-1 flex flex-col gap-0.5">
            {suggestions.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}

      {!editing && (
        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => {
              navigator.clipboard.writeText(letterContent);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>
            Edit
          </button>
          <form action={draftAction}>
            <input type="hidden" name="request_id" value={requestId} />
            <SubmitButton label="Re-draft" pendingLabel="Re-drafting…" />
          </form>
        </div>
      )}
    </div>
  );
}
