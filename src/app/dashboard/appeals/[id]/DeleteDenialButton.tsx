"use client";

import { deleteDenialAction } from "./actions";

export default function DeleteDenialButton({ denialId }: { denialId: string }) {
  return (
    <form
      action={deleteDenialAction}
      className="flex justify-end mb-6"
      onSubmit={(e) => {
        if (!confirm("Delete this claim denial and its appeal letter? This can't be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="denial_id" value={denialId} />
      <button
        type="submit"
        className="btn btn-outline btn-sm"
        style={{ color: "var(--danger-red)", borderColor: "var(--danger-red)" }}
      >
        Delete denial
      </button>
    </form>
  );
}
