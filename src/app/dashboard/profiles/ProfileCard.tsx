"use client";

import { useState } from "react";
import Avatar from "@/components/Avatar";
import { updateProfileAction, addBlackoutDateAction, deleteBlackoutDateAction } from "./actions";

interface Member {
  id: string;
  full_name: string | null;
  role: string;
  title: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
}

interface DoctorData {
  profile: {
    id: string;
    public_enabled: boolean;
    specialty: string | null;
    credentials: string | null;
    conditions_treated: string[];
    insurance_accepted: string[];
    languages: string[];
    accepting_new_patients: boolean;
    telehealth_available: boolean;
    city: string | null;
    state: string | null;
    zip: string | null;
    slug: string;
  };
  availability: { weekday: number; startTime: string; endTime: string }[];
  appointmentType: { id: string; durationMinutes: number; isTelehealth: boolean };
  blackoutDates: { id: string; date: string; reason: string | null }[];
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const INSURANCE_OPTIONS = ["Aetna", "Cigna / eviCore", "UnitedHealthcare", "Humana", "BCBS / Anthem", "Medicare", "Medicaid"];
const LANGUAGE_OPTIONS = ["English", "Spanish", "Mandarin", "Vietnamese", "Arabic", "Tagalog", "French", "Urdu/Hindi"];

interface HourRow {
  weekday: number;
  enabled: boolean;
  start: string;
  end: string;
}

function buildInitialHours(availability: DoctorData["availability"]): HourRow[] {
  return WEEKDAYS.map((_, weekday) => {
    const existing = availability.find((a) => a.weekday === weekday);
    return existing
      ? { weekday, enabled: true, start: existing.startTime, end: existing.endTime }
      : { weekday, enabled: false, start: "09:00", end: "17:00" };
  });
}

export default function ProfileCard({
  member,
  email,
  isSelf,
  roleLabel,
  doctorData,
  fullWidth,
}: {
  member: Member;
  email: string;
  isSelf: boolean;
  roleLabel: string;
  doctorData: DoctorData | null;
  fullWidth: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [hours, setHours] = useState<HourRow[]>(() => buildInitialHours(doctorData?.availability || []));

  const hasHours = hours.some((h) => h.enabled);
  const isDoctor = isSelf && !!doctorData;

  function updateHour(weekday: number, patch: Partial<HourRow>) {
    setHours((prev) => prev.map((h) => (h.weekday === weekday ? { ...h, ...patch } : h)));
  }

  if (editing) {
    const blocksJson = JSON.stringify(
      hours.filter((h) => h.enabled).map((h) => ({ weekday: h.weekday, start_time: h.start, end_time: h.end }))
    );

    return (
      <div className={`card p-4 flex flex-col gap-4 ${fullWidth ? "" : ""}`}>
        {isDoctor && (
          <pre style={{ fontSize: 10, background: "#fee", padding: 8, overflow: "auto" }}>
            DEBUG availability prop: {JSON.stringify(doctorData?.availability)}
          </pre>
        )}
        <form action={updateProfileAction} className="flex flex-col gap-3">
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

          {isDoctor && doctorData && (
            <div className="flex flex-col gap-4 pt-3 mt-1" style={{ borderTop: "1px solid var(--gray-200)" }}>
              <input type="hidden" name="is_doctor" value="1" />
              <input type="hidden" name="blocks" value={blocksJson} />
              <input type="hidden" name="appointment_type_id" value={doctorData.appointmentType.id} />

              <div className="text-[13.5px] font-semibold">Public booking profile</div>

              <label className="flex items-center justify-between">
                <span className="text-[13.5px]">Make my profile public so patients can find and book me</span>
                <input type="checkbox" name="public_enabled" defaultChecked={doctorData.profile.public_enabled} className="w-5 h-5 flex-shrink-0" />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Specialty</label>
                  <input className="input" name="specialty" placeholder="Orthopedic Surgery" defaultValue={doctorData.profile.specialty || ""} />
                </div>
                <div>
                  <label className="label">Credentials</label>
                  <input className="input" name="credentials" placeholder="MD, FAAOS" defaultValue={doctorData.profile.credentials || ""} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Conditions treated (comma separated)</label>
                  <input className="input" name="conditions_treated" defaultValue={doctorData.profile.conditions_treated.join(", ")} />
                </div>
                <div>
                  <label className="label">City</label>
                  <input className="input" name="city" defaultValue={doctorData.profile.city || ""} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">State</label>
                    <input className="input" name="state" maxLength={2} defaultValue={doctorData.profile.state || ""} />
                  </div>
                  <div>
                    <label className="label">ZIP</label>
                    <input className="input" name="zip" defaultValue={doctorData.profile.zip || ""} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2">
                <label className="flex items-center gap-2 text-[13px]">
                  <input type="checkbox" name="accepting_new_patients" defaultChecked={doctorData.profile.accepting_new_patients} className="w-4 h-4" />
                  Accepting new patients
                </label>
                <label className="flex items-center gap-2 text-[13px]">
                  <input type="checkbox" name="telehealth_available" defaultChecked={doctorData.appointmentType.isTelehealth} className="w-4 h-4" />
                  Telehealth available
                </label>
              </div>

              <div>
                <div className="label mb-1">Insurance accepted</div>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {INSURANCE_OPTIONS.map((opt) => (
                    <label key={opt} className="flex items-center gap-1.5 text-[13px]">
                      <input type="checkbox" name="insurance_accepted" value={opt} defaultChecked={doctorData.profile.insurance_accepted.includes(opt)} className="w-4 h-4" />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="label mb-1">Languages spoken</div>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <label key={opt} className="flex items-center gap-1.5 text-[13px]">
                      <input type="checkbox" name="languages" value={opt} defaultChecked={doctorData.profile.languages.includes(opt)} className="w-4 h-4" />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Appointment length (minutes)</label>
                <input className="input w-32" name="duration_minutes" type="number" min={5} defaultValue={doctorData.appointmentType.durationMinutes} />
              </div>

              <div>
                <div className="label mb-1">Working hours (required to save)</div>
                <div className="flex flex-col gap-1.5">
                  {hours.map((h) => (
                    <div key={h.weekday} className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-[13px] w-16 flex-shrink-0">
                        <input type="checkbox" checked={h.enabled} onChange={(e) => updateHour(h.weekday, { enabled: e.target.checked })} className="w-4 h-4" />
                        {WEEKDAYS[h.weekday]}
                      </label>
                      {h.enabled && (
                        <>
                          <input type="time" className="input w-auto" value={h.start} onChange={(e) => updateHour(h.weekday, { start: e.target.value })} />
                          <span className="text-gray-400 text-[13px]">to</span>
                          <input type="time" className="input w-auto" value={h.end} onChange={(e) => updateHour(h.weekday, { end: e.target.value })} />
                        </>
                      )}
                    </div>
                  ))}
                </div>
                {!hasHours && (
                  <p className="text-[12.5px] mt-2" style={{ color: "var(--danger-red)" }}>
                    Select at least one working day before you can save.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary btn-sm" disabled={isDoctor && !hasHours} onClick={() => setEditing(false)}>
              Save
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>

        {isDoctor && doctorData && (
          <div className="pt-3" style={{ borderTop: "1px solid var(--gray-200)" }}>
            <div className="label mb-1">Days off / holidays</div>
            <p className="text-[12px] text-gray-400 mb-2">No bookable times on these dates.</p>
            <form action={addBlackoutDateAction} className="flex items-end gap-2 flex-wrap mb-3">
              <input type="hidden" name="doctor_profile_id" value={doctorData.profile.id} />
              <div>
                <label className="label">Date</label>
                <input className="input" name="date" type="date" required />
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="label">Reason (optional)</label>
                <input className="input" name="reason" placeholder="Vacation" />
              </div>
              <button type="submit" className="btn btn-outline btn-sm">Add</button>
            </form>
            <div className="flex flex-col gap-1">
              {doctorData.blackoutDates.length === 0 && <p className="text-[12.5px] text-gray-400">None set.</p>}
              {doctorData.blackoutDates.map((b) => (
                <div key={b.id} className="flex items-center justify-between text-[13px] py-1" style={{ borderBottom: "1px solid var(--gray-100)" }}>
                  <span>{b.date}{b.reason ? <span className="text-gray-400"> — {b.reason}</span> : null}</span>
                  <form action={deleteBlackoutDateAction}>
                    <input type="hidden" name="id" value={b.id} />
                    <input type="hidden" name="doctor_profile_id" value={doctorData.profile.id} />
                    <button type="submit" className="text-btn text-[12px] text-gray-400">Remove</button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
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
      {isDoctor && doctorData && (
        <span className="status-pill self-start" style={doctorData.profile.public_enabled ? { background: "var(--success-bg)", color: "var(--success-green)" } : { background: "var(--gray-100)", color: "var(--gray-400)" }}>
          {doctorData.profile.public_enabled ? "Public booking profile on" : "Public booking profile off"}
        </span>
      )}
      {isSelf && (
        <button type="button" className="btn btn-outline btn-sm self-start" onClick={() => setEditing(true)}>
          Edit my profile
        </button>
      )}
    </div>
  );
}
