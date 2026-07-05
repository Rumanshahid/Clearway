"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { DASHBOARD_SECTIONS } from "@/lib/sections";
import { inviteMemberAction, revokeInviteAction } from "./actions";

export interface PendingInvite {
  id: string;
  email: string;
  role: string;
  title: string | null;
  expires_at: string;
  token: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>
      {pending ? "Sending…" : "Send invite"}
    </button>
  );
}

export default function InvitePanel({ invites, siteUrl }: { invites: PendingInvite[]; siteUrl: string }) {
  const [role, setRole] = useState("clinic_user");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copyLink(invite: PendingInvite) {
    await navigator.clipboard.writeText(`${siteUrl}/join/${invite.token}`);
    setCopiedId(invite.id);
    setTimeout(() => setCopiedId(null), 1800);
  }

  return (
    <div className="card p-6">
      <h2 className="text-[15px] font-semibold mb-1">Invite someone</h2>
      <p className="text-[12.5px] text-gray-400 mb-4">
        They&apos;ll get an email with a join link. If it doesn&apos;t arrive, copy the link from the pending list
        below and send it yourself — anyone who opens it after signing up joins your practice with the role you set here.
      </p>

      <form action={inviteMemberAction} className="flex flex-col gap-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="invite_email">Email</label>
            <input className="input" id="invite_email" name="email" type="email" required placeholder="staff@yourpractice.com" />
          </div>
          <div>
            <label className="label" htmlFor="invite_title">Title (optional)</label>
            <input className="input" id="invite_title" name="title" placeholder="e.g. Front Desk Coordinator, Nurse, Billing" />
          </div>
          <div className="col-span-2">
            <label className="label" htmlFor="invite_role">Role</label>
            <select className="input" id="invite_role" name="role" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="clinic_user">Staff — only the sections picked below</option>
              <option value="clinic_admin">Doctor / Admin — everything, can manage the team</option>
            </select>
          </div>
        </div>
        {role === "clinic_user" && (
          <div>
            <label className="label mb-1">Sections they can access</label>
            <div className="flex gap-5">
              {DASHBOARD_SECTIONS.map((s) => (
                <label key={s.key} className="flex items-center gap-1.5 text-[13.5px] text-gray-900">
                  <input type="checkbox" name="sections" value={s.key} defaultChecked className="w-4 h-4" />
                  {s.label}
                </label>
              ))}
            </div>
          </div>
        )}
        <SubmitButton />
      </form>

      {invites.length > 0 && (
        <div>
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
                      <button type="button" className="text-btn text-[12.5px] text-indigo-600" onClick={() => copyLink(invite)}>
                        {copiedId === invite.id ? "Copied ✓" : "Copy link"}
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
      )}
    </div>
  );
}
