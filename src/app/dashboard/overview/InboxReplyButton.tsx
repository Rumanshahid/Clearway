"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { replyToInboxMessageAction } from "./actions";

export default function InboxReplyButton({
  messageId,
  fromName,
  fromAddress,
  subject,
}: {
  messageId: string;
  fromName: string | null;
  fromAddress: string;
  subject: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="btn btn-outline btn-sm flex-shrink-0" onClick={() => setOpen(true)}>
        Reply
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Reply to ${fromName || fromAddress}`}>
        <form action={replyToInboxMessageAction} className="flex flex-col gap-3">
          <input type="hidden" name="inbox_message_id" value={messageId} />
          <p className="text-[12.5px] text-gray-400">
            {subject || "(no subject)"} · to {fromAddress}
          </p>
          <textarea className="input" name="body" rows={6} required placeholder="Write your reply…" />
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary btn-sm">Send reply</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
