"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { updatePatientDashboardLayoutAction } from "./dashboard-actions";
import type { PatientDashboardSectionDef } from "@/lib/patientDashboard";

// Same visual pattern as dashboard/overview/DashboardCustomizer.tsx --
// checkbox-only here since the patient dashboard's sections aren't
// reorderable widgets, just a fixed set that can be shown or hidden.
export default function PatientDashboardCustomizer({
  sections,
  initialHidden,
}: {
  sections: PatientDashboardSectionDef[];
  initialHidden: string[];
}) {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState<Set<string>>(new Set(initialHidden));

  function toggle(key: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <>
      <button type="button" className="btn btn-outline btn-sm flex-shrink-0" onClick={() => setOpen(true)}>
        Customize
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Customize dashboard">
        <form action={updatePatientDashboardLayoutAction} className="flex flex-col gap-4">
          <input type="hidden" name="hidden" value={JSON.stringify(Array.from(hidden))} />
          <p className="text-[12.5px] text-gray-400 -mt-1">Choose which sections show on your dashboard.</p>
          <div className="flex flex-col gap-1.5">
            {sections.map((s) => (
              <label key={s.key} className="flex items-center gap-2 text-[13.5px] rounded-lg px-2.5 py-1.5" style={{ background: "var(--gray-50)" }}>
                <input type="checkbox" checked={!hidden.has(s.key)} onChange={() => toggle(s.key)} className="w-4 h-4" />
                <span className="flex-1">{s.title}</span>
              </label>
            ))}
          </div>
          <button type="submit" className="btn btn-primary self-end" onClick={() => setOpen(false)}>
            Save
          </button>
        </form>
      </Modal>
    </>
  );
}
