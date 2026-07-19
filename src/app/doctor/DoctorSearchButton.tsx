"use client";

import { useState } from "react";
import Modal from "@/components/Modal";

export default function DoctorSearchButton({
  insuranceOptions,
  languageOptions,
  defaults,
}: {
  insuranceOptions: string[];
  languageOptions: string[];
  defaults: {
    q?: string;
    city?: string;
    insurance?: string;
    language?: string;
    new_patients?: string;
    telehealth?: string;
  };
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>
        Find a doctor
      </button>

      {/* No submit handler needed -- a plain GET form to the current page
          is exactly how the results already filter via searchParams, and
          the resulting navigation closes this modal for free. */}
      <Modal open={open} onClose={() => setOpen(false)} title="Find a doctor">
        <form className="flex flex-col gap-4">
          <div>
            <label className="label" htmlFor="q">Name or specialty</label>
            <input className="input" id="q" name="q" placeholder="Dr. Okonkwo, orthopedics..." defaultValue={defaults.q || ""} />
          </div>
          <div>
            <label className="label" htmlFor="city">City</label>
            <input className="input" id="city" name="city" placeholder="Austin" defaultValue={defaults.city || ""} />
          </div>
          <div>
            <label className="label" htmlFor="insurance">Insurance</label>
            <select className="input" id="insurance" name="insurance" defaultValue={defaults.insurance || ""}>
              <option value="">Any</option>
              {insuranceOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="language">Language</label>
            <select className="input" id="language" name="language" defaultValue={defaults.language || ""}>
              <option value="">Any</option>
              {languageOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-5">
            <label className="flex items-center gap-2 text-[13.5px]">
              <input type="checkbox" name="new_patients" value="1" defaultChecked={defaults.new_patients === "1"} className="w-4 h-4" />
              Accepting new patients
            </label>
            <label className="flex items-center gap-2 text-[13.5px]">
              <input type="checkbox" name="telehealth" value="1" defaultChecked={defaults.telehealth === "1"} className="w-4 h-4" />
              Telehealth available
            </label>
          </div>
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
      </Modal>
    </>
  );
}
