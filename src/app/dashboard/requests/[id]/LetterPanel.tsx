"use client";

import { useState } from "react";
import { updateLetterContentAction } from "./actions";
import { LETTER_SECTION_KEYS, type LetterSectionKey } from "@/lib/anthropic";
import type { LetterMeta } from "@/lib/database.types";

type Sections = Partial<Record<LetterSectionKey, { label: string; content: string }>>;

const RISK_STYLE: Record<string, { bg: string; color: string }> = {
  LOW: { bg: "var(--success-bg)", color: "var(--success-green)" },
  MEDIUM: { bg: "var(--amber-bg)", color: "var(--amber)" },
  HIGH: { bg: "var(--danger-bg)", color: "var(--danger-red)" },
};

export default function LetterPanel({
  letterId,
  requestId,
  content,
  sections,
  meta,
  locked,
}: {
  letterId: string;
  requestId: string;
  content: string;
  sections: Sections | null;
  meta: LetterMeta | null;
  locked: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draftSections, setDraftSections] = useState<Sections>(sections || {});
  const [draftContent, setDraftContent] = useState(content);
  const [copied, setCopied] = useState(false);

  const orderedKeys = LETTER_SECTION_KEYS.filter((key) => draftSections[key]);
  const hasSections = orderedKeys.length > 0;

  function flattenSections(s: Sections): string {
    return LETTER_SECTION_KEYS.filter((key) => s[key])
      .map((key) => `${s[key]!.label}\n${s[key]!.content}`)
      .join("\n\n");
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(hasSections ? flattenSections(draftSections) : draftContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-semibold">Letter draft</h2>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-outline btn-sm" onClick={handleCopy}>
            {copied ? "Copied ✓" : "Copy to clipboard"}
          </button>
          {!locked && (
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing((v) => !v)}>
              {editing ? "Cancel" : "Edit"}
            </button>
          )}
        </div>
      </div>

      {meta && (
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span className="status-pill" style={RISK_STYLE[meta.denialRiskAssessment] || RISK_STYLE.MEDIUM}>
            Denial risk: {meta.denialRiskAssessment}
          </span>
          <span className="status-pill" style={{ background: "var(--gray-100)", color: "var(--gray-600)" }}>
            {meta.approachUsed.replace(/_/g, " ")}
          </span>
        </div>
      )}
      {meta?.denialRiskReason && <p className="text-[12.5px] text-gray-600 mb-4">{meta.denialRiskReason}</p>}
      {meta && meta.softWarnings.length > 0 && (
        <div className="text-[12.5px] rounded-lg px-3 py-2 mb-4" style={{ background: "var(--amber-bg)", color: "var(--amber)" }}>
          <strong>Worth checking before you submit:</strong>
          <ul className="list-disc pl-5 mt-1">
            {meta.softWarnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      {editing ? (
        <form
          action={async (formData) => {
            formData.set("content", flattenSections(draftSections) || draftContent);
            if (hasSections) formData.set("sections", JSON.stringify(draftSections));
            await updateLetterContentAction(formData);
            setEditing(false);
          }}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="letter_id" value={letterId} />
          <input type="hidden" name="request_id" value={requestId} />
          {hasSections ? (
            orderedKeys.map((key) => (
              <div key={key}>
                <label className="label">{draftSections[key]!.label}</label>
                <textarea
                  className="input font-sans text-[13.5px] leading-relaxed"
                  rows={4}
                  value={draftSections[key]!.content}
                  onChange={(e) =>
                    setDraftSections((prev) => ({
                      ...prev,
                      [key]: { ...prev[key]!, content: e.target.value },
                    }))
                  }
                />
              </div>
            ))
          ) : (
            <textarea
              className="input font-mono text-[13px] leading-relaxed"
              name="content"
              rows={22}
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
            />
          )}
          <button className="btn btn-primary self-start" type="submit">Save changes</button>
        </form>
      ) : hasSections ? (
        <div className="flex flex-col gap-4">
          {orderedKeys.map((key) => (
            <div key={key}>
              <div className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-1">{draftSections[key]!.label}</div>
              <div className="text-[13.5px] leading-relaxed text-gray-900 whitespace-pre-wrap">{draftSections[key]!.content}</div>
            </div>
          ))}
        </div>
      ) : (
        <pre className="whitespace-pre-wrap text-[13.5px] leading-relaxed font-sans text-gray-900">{draftContent}</pre>
      )}
    </div>
  );
}
