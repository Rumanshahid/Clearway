"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import PatientPaForm, { type DoctorOption } from "./PatientPaForm";

// createAndDraftPatientPaRequestAction redirects to /patient/pa?submitted=...
// (or ?error=...) either way, which remounts this component fresh -- so the
// modal closing on success needs no extra handling here, the navigation
// does it for free (same pattern as dashboard/team/InviteButton.tsx).
export default function NewPaRequestButton({ doctors }: { doctors: DoctorOption[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="btn btn-primary btn-sm flex-shrink-0" onClick={() => setOpen(true)}>
        + New request
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="New prior-authorization request">
        <PatientPaForm doctors={doctors} />
      </Modal>
    </>
  );
}
