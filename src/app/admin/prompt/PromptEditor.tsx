"use client";

import { useState } from "react";
import { saveTemplateVersionAction } from "./actions";

export default function PromptEditor({
  initialContent,
  procedures,
}: {
  initialContent: string;
  procedures: { key: string; label: string }[];
}) {
  const [content, setContent] = useState(initialContent);
  const [procedureKey, setProcedureKey] = useState(procedures[0]?.key || "");
  const [preview, setPreview] = useState<string | null>(null);
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
        body: JSON.stringify({ template: content, procedureKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Preview failed");
      setPreview(data.content);
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
          <code>{"{{excluded_payers_note}}"}</code> <code>{"{{letter_components_list}}"}</code>
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
        <div className="flex items-center gap-3 mb-4">
          <select className="input max-w-[280px]" value={procedureKey} onChange={(e) => setProcedureKey(e.target.value)}>
            {procedures.map((p) => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>
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
          <pre className="whitespace-pre-wrap text-[13px] leading-relaxed font-sans p-4 rounded-lg" style={{ background: "var(--gray-50)" }}>
            {preview}
          </pre>
        )}
      </section>
    </div>
  );
}
