"use client";

import { useState } from "react";
import Avatar from "@/components/Avatar";
import { updateProfileAction } from "./actions";

interface Member {
  id: string;
  full_name: string | null;
  role: string;
  title: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
}

export default function ProfileCard({
  member,
  email,
  isSelf,
  roleLabel,
}: {
  member: Member;
  email: string;
  isSelf: boolean;
  roleLabel: string;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <form action={updateProfileAction} className="card p-4 flex flex-col gap-3">
        <input type="hidden" name="member_id" value={member.id} />
        <div className="flex items-center gap-3">
          <Avatar name={member.full_name} userId={member.id} avatarUrl={member.avatar_url} size={44} />
          <div>
            <label className="label" htmlFor={`avatar-${member.id}`}>Photo</label>
            <input className="input" id={`avatar-${member.id}`} name="avatar" type="file" accept="image/*" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor={`name-${member.id}`}>Name</label>
          <input className="input" id={`name-${member.id}`} name="full_name" defaultValue={member.full_name || ""} placeholder="Full name" />
        </div>
        <div>
          <label className="label" htmlFor={`phone-${member.id}`}>Phone</label>
          <input className="input" id={`phone-${member.id}`} name="phone" defaultValue={member.phone || ""} placeholder="Optional" />
        </div>
        <div>
          <label className="label" htmlFor={`bio-${member.id}`}>About</label>
          <textarea className="input" id={`bio-${member.id}`} name="bio" defaultValue={member.bio || ""} rows={2} placeholder="A short line about them" />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary btn-sm" onClick={() => setEditing(false)}>Save</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </form>
    );
  }

  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Avatar name={member.full_name} userId={member.id} avatarUrl={member.avatar_url} size={44} />
        <div className="min-w-0">
          <div className="text-[14px] font-semibold truncate">{member.full_name || "Unnamed"}{isSelf && <span className="text-gray-400 font-normal"> (you)</span>}</div>
          <div className="text-[12px] text-gray-400">{member.title || roleLabel}</div>
        </div>
      </div>
      {member.bio && <p className="text-[13px] text-gray-600">{member.bio}</p>}
      <div className="text-[12px] text-gray-400 flex flex-col gap-0.5">
        {email && <span>{email}</span>}
        {member.phone && <span>{member.phone}</span>}
      </div>
      {isSelf && (
        <button type="button" className="btn btn-outline btn-sm self-start" onClick={() => setEditing(true)}>
          Edit my profile
        </button>
      )}
    </div>
  );
}
