"use client";

import { useState } from "react";
import { DASHBOARD_SECTIONS } from "@/lib/sections";
import { updateMemberAction, removeMemberAction } from "./actions";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  title: string | null;
  sections: string[];
  requestsCount: number;
  denialsCount: number;
}

const ROLE_LABELS: Record<string, string> = {
  clinic_admin: "Doctor / Admin",
  clinic_user: "Staff",
  super_admin: "Super Admin",
};

export default function MemberRow({ member, isSelf }: { member: TeamMember; isSelf: boolean }) {
  const [editing, setEditing] = useState(false);
  const [role, setRole] = useState(member.role);
  const isAdmin = member.role === "clinic_admin" || member.role === "super_admin";

  if (editing) {
    return (
      <tr style={{ borderBottom: "1px solid var(--gray-100)" }}>
        <td className="px-5 py-3" colSpan={7}>
          <form action={updateMemberAction} className="flex flex-wrap items-end gap-4">
            <input type="hidden" name="member_id" value={member.id} />
            <div className="text-[13.5px] font-medium min-w-[140px]">{member.name}</div>
            <div>
              <label className="label" htmlFor={`title-${member.id}`}>Title</label>
              <input
                className="input"
                id={`title-${member.id}`}
                name="title"
                defaultValue={member.title || ""}
                placeholder="e.g. Front Desk Coordinator"
              />
            </div>
            <div>
              <label className="label" htmlFor={`role-${member.id}`}>Role</label>
              <select className="input" id={`role-${member.id}`} name="role" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="clinic_user">Staff</option>
                <option value="clinic_admin">Doctor / Admin</option>
              </select>
            </div>
            {role === "clinic_user" && (
              <div>
                <label className="label mb-1">Can access</label>
                <div className="flex gap-4">
                  {DASHBOARD_SECTIONS.map((s) => (
                    <label key={s.key} className="flex items-center gap-1.5 text-[13px] text-gray-900">
                      <input
                        type="checkbox"
                        name="sections"
                        value={s.key}
                        defaultChecked={member.sections.includes(s.key)}
                        className="w-4 h-4"
                      />
                      {s.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <button className="btn btn-primary btn-sm" type="submit">Save</button>
              <button className="btn btn-outline btn-sm" type="button" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr style={{ borderBottom: "1px solid var(--gray-100)" }}>
      <td className="px-5 py-3">
        <div className="font-medium">{member.name}{isSelf && <span className="text-gray-400 font-normal"> (you)</span>}</div>
        <div className="text-[12px] text-gray-400">{member.email}</div>
      </td>
      <td className="px-5 py-3 text-gray-600">{member.title || "—"}</td>
      <td className="px-5 py-3">
        <span
          className="status-pill"
          style={
            isAdmin
              ? { background: "var(--indigo-50, #EEF0FE)", color: "var(--indigo-600)" }
              : { background: "var(--gray-100)", color: "var(--gray-600)" }
          }
        >
          {ROLE_LABELS[member.role] || member.role}
        </span>
      </td>
      <td className="px-5 py-3 text-gray-600 text-[13px]">
        {isAdmin
          ? "Everything"
          : member.sections.length > 0
            ? DASHBOARD_SECTIONS.filter((s) => member.sections.includes(s.key)).map((s) => s.label).join(", ")
            : "Nothing yet"}
      </td>
      <td className="px-5 py-3 text-gray-600">{member.requestsCount}</td>
      <td className="px-5 py-3 text-gray-600">{member.denialsCount}</td>
      <td className="px-5 py-3">
        {!isSelf && (
          <div className="flex items-center gap-3">
            <button type="button" className="text-btn text-[12.5px] text-indigo-600" onClick={() => setEditing(true)}>
              Edit
            </button>
            <form
              action={removeMemberAction}
              onSubmit={(e) => {
                if (!confirm(`Remove ${member.name} from the practice? Their account survives, but they lose all access to this practice's data. Their past work stays.`)) {
                  e.preventDefault();
                }
              }}
            >
              <input type="hidden" name="member_id" value={member.id} />
              <button type="submit" className="text-btn text-[12.5px]" style={{ color: "var(--danger-red)" }}>
                Remove
              </button>
            </form>
          </div>
        )}
      </td>
    </tr>
  );
}
