"use client";

import { useState } from "react";
import { updateLetterContentAction } from "./actions";

export default function LetterPanel({
  letterId,
  requestId,
  content,
  locked,
}: {
  letterId: string;
  requestId: string;
  content: string;
  locked: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(draft);
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

      {editing ? (
        <form
          action={async (formData) => {
            await updateLetterContentAction(formData);
            setEditing(false);
          }}
          className="flex flex-col gap-3"
        >
          <input type="hidden" name="letter_id" value={letterId} />
          <input type="hidden" name="request_id" value={requestId} />
          <textarea
            className="input font-mono text-[13px] leading-relaxed"
            name="content"
            rows={22}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button className="btn btn-primary self-start" type="submit">Save changes</button>
        </form>
      ) : (
        <pre className="whitespace-pre-wrap text-[13.5px] leading-relaxed font-sans text-gray-900">{draft}</pre>
      )}
    </div>
  );
}
