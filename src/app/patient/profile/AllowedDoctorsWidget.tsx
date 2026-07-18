"use client";

import { useRef } from "react";
import { toggleDoctorAccessAction } from "./access-actions";

export interface DoctorAccessRow {
  doctorProfileId: string;
  doctorName: string;
  accessGranted: boolean;
  requested: boolean;
}

function AccessRow({ row }: { row: DoctorAccessRow }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={toggleDoctorAccessAction} className="flex items-center justify-between gap-3" style={{ fontSize: 12.5 }}>
      <input type="hidden" name="doctor_profile_id" value={row.doctorProfileId} />
      <div className="min-w-0">
        <div className="font-medium text-gray-900 truncate">{row.doctorName}</div>
        {!row.accessGranted && row.requested && <div className="text-gray-400">Requested access</div>}
      </div>
      <label className="flex items-center gap-1.5 flex-shrink-0">
        <input
          type="checkbox"
          name="grant"
          className="w-4 h-4"
          defaultChecked={row.accessGranted}
          onChange={() => formRef.current?.requestSubmit()}
        />
      </label>
    </form>
  );
}

export default function AllowedDoctorsWidget({ rows }: { rows: DoctorAccessRow[] }) {
  return (
    <div className="card p-5">
      <h2 className="text-[13.5px] font-semibold mb-1">Allowed Doctors</h2>
      <p className="text-gray-400 mb-3" style={{ fontSize: 11.5 }}>
        Tick a doctor to let them see your profile.
      </p>
      {rows.length > 0 ? (
        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <AccessRow key={row.doctorProfileId} row={row} />
          ))}
        </div>
      ) : (
        <p className="text-gray-400" style={{ fontSize: 12.5 }}>No doctors yet.</p>
      )}
    </div>
  );
}
