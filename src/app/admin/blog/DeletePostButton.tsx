"use client";

import { deletePostAction } from "./actions";

export default function DeletePostButton({ postId }: { postId: string }) {
  return (
    <form
      action={deletePostAction}
      onSubmit={(e) => {
        if (!confirm("Delete this post? This can't be undone.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="post_id" value={postId} />
      <button type="submit" className="btn btn-outline btn-sm" style={{ color: "var(--danger-red)", borderColor: "var(--danger-red)" }}>
        Delete
      </button>
    </form>
  );
}
