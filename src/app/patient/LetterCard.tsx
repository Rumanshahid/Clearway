"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-outline btn-sm" disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}

export default function LetterCard({
  requestId,
  letterContent,
  draftAction,
}: {
  requestId: string;
  letterContent: string | null;
  draftAction: (formData: FormData) => void | Promise<void>;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--gray-200)" }}>
      {letterContent ? (
        <>
          <pre className="text-[12.5px] text-gray-700 whitespace-pre-wrap mb-2" style={{ fontFamily: "inherit" }}>
            {letterContent}
          </pre>
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
            <form action={draftAction}>
              <input type="hidden" name="request_id" value={requestId} />
              <SubmitButton label="Re-draft" pendingLabel="Re-drafting…" />
            </form>
          </div>
        </>
      ) : (
        <form action={draftAction}>
          <input type="hidden" name="request_id" value={requestId} />
          <SubmitButton label="Draft letter" pendingLabel="Drafting…" />
        </form>
      )}
    </div>
  );
}
