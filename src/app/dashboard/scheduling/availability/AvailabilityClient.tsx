"use client";

import { useState } from "react";
import { saveAvailabilityAction, addBlackoutDateAction, deleteBlackoutDateAction } from "../actions";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const US_TIMEZONES = [
  { value: "America/New_York", label: "Eastern" },
  { value: "America/Chicago", label: "Central" },
  { value: "America/Denver", label: "Mountain" },
  { value: "America/Phoenix", label: "Arizona (no DST)" },
  { value: "America/Los_Angeles", label: "Pacific" },
  { value: "America/Anchorage", label: "Alaska" },
  { value: "Pacific/Honolulu", label: "Hawaii" },
];

interface Block {
  weekday: number;
  start_time: string;
  end_time: string;
}

interface BlackoutDate {
  id: string;
  date: string;
  reason: string | null;
}

export default function AvailabilityClient({
  doctorProfileId,
  initialBlocks,
  timezone,
  minNoticeHours,
  maxAdvanceDays,
  maxAppointmentsPerDay,
  blackoutDates,
}: {
  doctorProfileId: string;
  initialBlocks: Block[];
  timezone: string;
  minNoticeHours: number;
  maxAdvanceDays: number;
  maxAppointmentsPerDay: number | null;
  blackoutDates: BlackoutDate[];
}) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks.length ? initialBlocks : [{ weekday: 1, start_time: "09:00", end_time: "17:00" }]);

  function updateBlock(index: number, patch: Partial<Block>) {
    setBlocks((prev) => prev.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  }

  function addBlock() {
    setBlocks((prev) => [...prev, { weekday: 1, start_time: "09:00", end_time: "17:00" }]);
  }

  function removeBlock(index: number) {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-6">
      <form action={saveAvailabilityAction} className="card p-5 flex flex-col gap-4">
        <input type="hidden" name="doctor_profile_id" value={doctorProfileId} />
        <input type="hidden" name="blocks" value={JSON.stringify(blocks)} />

        <div className="label mb-0">Working hours</div>
        <div className="flex flex-col gap-2">
          {blocks.map((block, i) => (
            <div key={i} className="flex items-center gap-2 flex-wrap">
              <select
                className="input w-auto"
                value={block.weekday}
                onChange={(e) => updateBlock(i, { weekday: Number(e.target.value) })}
              >
                {WEEKDAYS.map((day, idx) => (
                  <option key={idx} value={idx}>{day}</option>
                ))}
              </select>
              <input
                type="time"
                className="input w-auto"
                value={block.start_time}
                onChange={(e) => updateBlock(i, { start_time: e.target.value })}
              />
              <span className="text-gray-400 text-[13px]">to</span>
              <input
                type="time"
                className="input w-auto"
                value={block.end_time}
                onChange={(e) => updateBlock(i, { end_time: e.target.value })}
              />
              <button type="button" className="text-btn text-[12.5px] text-gray-400" onClick={() => removeBlock(i)}>
                Remove
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-outline btn-sm self-start" onClick={addBlock}>
          + Add block
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2" style={{ borderTop: "1px solid var(--gray-200)" }}>
          <div>
            <label className="label" htmlFor="timezone">Timezone</label>
            <select className="input" id="timezone" name="timezone" defaultValue={timezone}>
              {US_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="max_appointments_per_day">Max appointments per day (blank = unlimited)</label>
            <input
              className="input"
              id="max_appointments_per_day"
              name="max_appointments_per_day"
              type="number"
              min={1}
              defaultValue={maxAppointmentsPerDay ?? ""}
            />
          </div>
          <div>
            <label className="label" htmlFor="min_notice_hours">Minimum notice (hours)</label>
            <input className="input" id="min_notice_hours" name="min_notice_hours" type="number" min={0} defaultValue={minNoticeHours} />
          </div>
          <div>
            <label className="label" htmlFor="max_advance_days">Max days ahead patients can book</label>
            <input className="input" id="max_advance_days" name="max_advance_days" type="number" min={1} defaultValue={maxAdvanceDays} />
          </div>
        </div>

        <button type="submit" className="btn btn-primary self-start">Save availability</button>
      </form>

      <div className="card p-5">
        <div className="label mb-2">Blackout dates</div>
        <p className="text-[12.5px] text-gray-400 mb-3">Holidays, vacation, conference days — no bookable slots on these dates.</p>

        <form action={addBlackoutDateAction} className="flex items-end gap-2 flex-wrap mb-4">
          <input type="hidden" name="doctor_profile_id" value={doctorProfileId} />
          <div>
            <label className="label" htmlFor="blackout_date">Date</label>
            <input className="input" id="blackout_date" name="date" type="date" required />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="label" htmlFor="blackout_reason">Reason (optional)</label>
            <input className="input" id="blackout_reason" name="reason" placeholder="Vacation" />
          </div>
          <button type="submit" className="btn btn-outline btn-sm">Add</button>
        </form>

        <div className="flex flex-col gap-1">
          {blackoutDates.length === 0 && <p className="text-[13px] text-gray-400">No blackout dates yet.</p>}
          {blackoutDates.map((b) => (
            <div key={b.id} className="flex items-center justify-between text-[13.5px] py-1.5" style={{ borderBottom: "1px solid var(--gray-100)" }}>
              <span>{b.date}{b.reason ? <span className="text-gray-400"> — {b.reason}</span> : null}</span>
              <form action={deleteBlackoutDateAction}>
                <input type="hidden" name="id" value={b.id} />
                <input type="hidden" name="doctor_profile_id" value={doctorProfileId} />
                <button type="submit" className="text-btn text-[12.5px] text-gray-400">Remove</button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
