"use client";

import { useState } from "react";
import type { FieldDef, FieldType } from "@/lib/criteria";
import { saveCriteriaAction } from "../actions";

const FIELD_TYPES: FieldType[] = ["text", "textarea", "select", "number", "checkboxes"];

export default function CriteriaEditor({
  id,
  initialKey,
  initialLabel,
  initialRequiredFields,
  initialRedFlags,
  initialAetna,
  initialEvicore,
  initialSources,
  initialPromptNotes,
  initialEnabled,
}: {
  id?: string;
  initialKey: string;
  initialLabel: string;
  initialRequiredFields: FieldDef[];
  initialRedFlags: string[];
  initialAetna: string;
  initialEvicore: string;
  initialSources: string;
  initialPromptNotes: string;
  initialEnabled: boolean;
}) {
  const [fields, setFields] = useState<FieldDef[]>(
    initialRequiredFields.length > 0
      ? initialRequiredFields
      : [{ key: "", label: "", type: "text", required: true }]
  );

  function updateField(index: number, patch: Partial<FieldDef>) {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  return (
    <form action={saveCriteriaAction} className="flex flex-col gap-6">
      {id && <input type="hidden" name="id" value={id} />}

      <section className="card p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="key">Key (used internally, no spaces)</label>
            <input className="input" id="key" name="key" defaultValue={initialKey} required />
          </div>
          <div>
            <label className="label" htmlFor="label">Label (shown to staff)</label>
            <input className="input" id="label" name="label" defaultValue={initialLabel} required />
          </div>
        </div>
        <label className="flex items-center gap-2 text-[13.5px] mt-4">
          <input type="checkbox" name="enabled" defaultChecked={initialEnabled} className="w-4 h-4" />
          Enabled — shows in the intake form
        </label>
      </section>

      <section className="card p-6">
        <h2 className="text-[15px] font-semibold mb-4">Required intake fields</h2>
        <div className="flex flex-col gap-4">
          {fields.map((field, i) => (
            <div key={i} className="border rounded-[10px] p-4" style={{ borderColor: "var(--gray-200)" }}>
              <div className="grid grid-cols-4 gap-3 mb-2">
                <div>
                  <label className="label">Key</label>
                  <input
                    className="input"
                    name="field_key"
                    value={field.key}
                    onChange={(e) => updateField(i, { key: e.target.value })}
                    placeholder="symptom_duration"
                  />
                </div>
                <div>
                  <label className="label">Label</label>
                  <input
                    className="input"
                    name="field_label"
                    value={field.label}
                    onChange={(e) => updateField(i, { label: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Type</label>
                  <select
                    className="input"
                    name="field_type"
                    value={field.type}
                    onChange={(e) => updateField(i, { type: e.target.value as FieldType })}
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-[13px]">
                    <input
                      type="checkbox"
                      name="field_required"
                      checked={field.required}
                      onChange={(e) => updateField(i, { required: e.target.checked })}
                      className="w-4 h-4"
                    />
                    Required
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Help text (optional)</label>
                  <input
                    className="input"
                    name="field_help"
                    value={field.helpText || ""}
                    onChange={(e) => updateField(i, { helpText: e.target.value })}
                  />
                </div>
                {field.type === "select" && (
                  <div>
                    <label className="label">Options (comma-separated)</label>
                    <input
                      className="input"
                      name="field_options"
                      value={field.options?.join(", ") || ""}
                      onChange={(e) => updateField(i, { options: e.target.value.split(",").map((o) => o.trim()) })}
                    />
                  </div>
                )}
                {field.type !== "select" && <input type="hidden" name="field_options" value="" />}
              </div>
              <button
                type="button"
                className="text-[12px] mt-3"
                style={{ color: "var(--danger-red)" }}
                onClick={() => setFields((prev) => prev.filter((_, idx) => idx !== i))}
              >
                Remove field
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-outline btn-sm mt-4"
          onClick={() => setFields((prev) => [...prev, { key: "", label: "", type: "text", required: true }])}
        >
          + Add field
        </button>
      </section>

      <section className="card p-6">
        <label className="label" htmlFor="red_flags">Red flags (one per line)</label>
        <textarea className="input" id="red_flags" name="red_flags" rows={5} defaultValue={initialRedFlags.join("\n")} />
      </section>

      <section className="card p-6 flex flex-col gap-4">
        <div>
          <label className="label" htmlFor="aetna">Aetna criteria (paraphrased)</label>
          <textarea className="input" id="aetna" name="aetna" rows={4} defaultValue={initialAetna} />
        </div>
        <div>
          <label className="label" htmlFor="evicore">Cigna / eviCore criteria (paraphrased)</label>
          <textarea className="input" id="evicore" name="evicore" rows={4} defaultValue={initialEvicore} />
        </div>
        <div>
          <label className="label" htmlFor="sources">Sources</label>
          <input className="input" id="sources" name="sources" defaultValue={initialSources} />
        </div>
        <div>
          <label className="label" htmlFor="prompt_notes">Drafting guidance for Claude</label>
          <textarea className="input" id="prompt_notes" name="prompt_notes" rows={4} defaultValue={initialPromptNotes} />
        </div>
      </section>

      <button className="btn btn-primary self-start" type="submit">Save procedure</button>
    </form>
  );
}
