"use client";

import { useState } from "react";
import { saveTemplateVersionAction } from "./actions";

interface LetterSection {
  label: string;
  content: string;
}

interface PreviewResult {
  letterTitle: string;
  sections: Record<string, LetterSection>;
  meta: {
    approachUsed: string;
    redFlagsIdentified: string[];
    softWarnings: string[];
    denialRiskAssessment: "LOW" | "MEDIUM" | "HIGH";
    denialRiskReason: string;
  };
}

const RISK_STYLE: Record<string, { bg: string; color: string }> = {
  LOW: { bg: "var(--success-bg)", color: "var(--success-green)" },
  MEDIUM: { bg: "var(--amber-bg)", color: "var(--amber)" },
  HIGH: { bg: "var(--danger-bg)", color: "var(--danger-red)" },
};

export default function PromptEditor({
  initialContent,
  procedures,
}: {
  initialContent: string;
  procedures: { key: string; label: string }[];
}) {
  const [content, setContent] = useState(initialContent);
  const [procedureKey, setProcedureKey] = useState(procedures[0]?.key || "");
  const [useRedFlags, setUseRedFlags] = useState(true);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function runPreview() {
    setLoading(true);
    setPreviewError(null);
    setPreview(null);
    try {
      const res = await fetch("/api/admin/preview-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: content, procedureKey, useRedFlags }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Preview failed");
      setPreview(data);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="card p-6">
        <h2 className="text-[15px] font-semibold mb-1">Wrapper prompt</h2>
        <p className="text-[12.5px] text-gray-400 mb-4">
          Placeholders: <code>{"{{procedure_label}}"}</code> <code>{"{{aetna}}"}</code> <code>{"{{evicore}}"}</code>{" "}
          <code>{"{{sources}}"}</code> <code>{"{{red_flags_list}}"}</code> <code>{"{{prompt_notes}}"}</code>{" "}
          <code>{"{{excluded_payers_note}}"}</code> <code>{"{{approach_instruction}}"}</code>{" "}
          <code>{"{{letter_components_list}}"}</code>
        </p>
        <p className="text-[12.5px] text-gray-400 mb-4">
          Claude must return a single JSON object (8 labeled sections + a meta block with approach, red flags,
          soft warnings, and a denial-risk assessment) — see the default template for the exact shape it&apos;s
          instructed to follow.
        </p>
        <textarea
          className="input font-mono text-[12.5px] leading-relaxed"
          rows={20}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex items-center gap-3 mt-4">
          <form action={saveTemplateVersionAction}>
            <input type="hidden" name="content" value={content} />
            <button className="btn btn-primary" type="submit">Save as new active version</button>
          </form>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-[15px] font-semibold mb-4">Preview — test generation with dummy data</h2>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <select className="input max-w-[280px]" value={procedureKey} onChange={(e) => setProcedureKey(e.target.value)}>
            {procedures.map((p) => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-[13px] text-gray-600">
            <input type="checkbox" checked={useRedFlags} onChange={(e) => setUseRedFlags(e.target.checked)} className="w-4 h-4" />
            Include this procedure&apos;s red flags (tests the RED_FLAG approach)
          </label>
          <button className="btn btn-outline" type="button" onClick={runPreview} disabled={loading || !procedureKey}>
            {loading ? "Generating…" : "Run test generation"}
          </button>
        </div>
        {previewError && (
          <div className="text-[13px] rounded-lg px-3 py-2 mb-3" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
            {previewError}
          </div>
        )}
        {preview && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="status-pill" style={RISK_STYLE[preview.meta.denialRiskAssessment] || RISK_STYLE.MEDIUM}>
                Denial risk: {preview.meta.denialRiskAssessment}
              </span>
              <span className="status-pill" style={{ background: "var(--gray-100)", color: "var(--gray-600)" }}>
                Approach: {preview.meta.approachUsed}
              </span>
            </div>
            <p className="text-[12.5px] text-gray-600">{preview.meta.denialRiskReason}</p>

            {preview.meta.softWarnings.length > 0 && (
              <div className="text-[12.5px] rounded-lg px-3 py-2" style={{ background: "var(--amber-bg)", color: "var(--amber)" }}>
                <strong>Soft warnings:</strong>
                <ul className="list-disc pl-5 mt-1">
                  {preview.meta.softWarnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}

            <div className="p-4 rounded-lg flex flex-col gap-4" style={{ background: "var(--gray-50)" }}>
              <div className="font-semibold text-[13.5px]">{preview.letterTitle}</div>
              {Object.values(preview.sections).map((section) => (
                <div key={section.label}>
                  <div className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-1">{section.label}</div>
                  <div className="text-[13px] leading-relaxed whitespace-pre-wrap">{section.content}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
