"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import Modal from "@/components/Modal";
import { DASHBOARD_SECTIONS } from "@/lib/sections";
import { inviteMemberAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>
      {pending ? "Sending…" : "Send invite"}
    </button>
  );
}

// inviteMemberAction redirects to /dashboard/team?invited=... (or ?error=...)
// on completion either way, which remounts this component fresh -- so the
// modal closing on success needs no extra handling here, the navigation
// does it for free.
export default function InviteButton() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("clinic_user");

  return (
    <>
      <button type="button" className="btn btn-primary btn-sm flex-shrink-0" onClick={() => setOpen(true)}>
        + Invite
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Invite someone">
        <p className="text-[12.5px] text-gray-400 mb-4">
          They&apos;ll get an email with a join link. If it doesn&apos;t arrive, copy the link from the pending list
          below and send it yourself — it signs them in and joins them automatically, no password needed.
        </p>

        <form action={inviteMemberAction} className="flex flex-col gap-4">
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
      </Modal>
    </>
  );
}
