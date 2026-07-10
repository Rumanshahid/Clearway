"use client";

import { useState } from "react";
import { revokeInviteAction, generateInviteLinkAction } from "./actions";

export interface PendingInvite {
  id: string;
  email: string;
  role: string;
  title: string | null;
  expires_at: string;
  token: string;
}

// The invite-creation form itself lives in InviteButton's popup now -- this
// is just the pending-invites list that sits below the member table.
export default function InvitePanel({ invites }: { invites: PendingInvite[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (invites.length === 0) return null;

  async function copyLink(invite: PendingInvite) {
    setLoadingId(invite.id);
    setErrorId(null);
    const result = await generateInviteLinkAction(invite.id);
    setLoadingId(null);

    if (!result.link) {
      setErrorId(invite.id);
      setTimeout(() => setErrorId(null), 3000);
      return;
    }

    await navigator.clipboard.writeText(result.link);
    setCopiedId(invite.id);
    setTimeout(() => setCopiedId(null), 1800);
  }

  return (
    <div className="card p-6">
      <h3 className="text-[13px] font-semibold text-gray-900 mb-2">Pending invites</h3>
      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-left text-gray-400 text-[11px] uppercase tracking-wide" style={{ borderBottom: "1px solid var(--gray-200)" }}>
            <th className="py-2 font-semibold">Email</th>
            <th className="py-2 font-semibold">Title</th>
            <th className="py-2 font-semibold">Role</th>
            <th className="py-2 font-semibold">Expires</th>
            <th className="py-2 font-semibold"></th>
          </tr>
        </thead>
        <tbody>
          {invites.map((invite) => (
            <tr key={invite.id} style={{ borderBottom: "1px solid var(--gray-100)" }}>
              <td className="py-2 text-gray-600">{invite.email}</td>
              <td className="py-2 text-gray-600">{invite.title || "—"}</td>
              <td className="py-2 text-gray-600">{invite.role === "clinic_admin" ? "Doctor / Admin" : "Staff"}</td>
              <td className="py-2 text-gray-600">{new Date(invite.expires_at).toLocaleDateString()}</td>
              <td className="py-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="text-btn text-[12.5px] text-indigo-600"
                    onClick={() => copyLink(invite)}
                    disabled={loadingId === invite.id}
                  >
                    {copiedId === invite.id
                      ? "Copied ✓"
                      : errorId === invite.id
                        ? "Failed — retry"
                        : loadingId === invite.id
                          ? "Generating…"
                          : "Copy link"}
                  </button>
                  <form action={revokeInviteAction}>
                    <input type="hidden" name="invite_id" value={invite.id} />
                    <button type="submit" className="text-btn text-[12.5px]" style={{ color: "var(--danger-red)" }}>
                      Revoke
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
