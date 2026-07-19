"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import PatientAppealForm from "./PatientAppealForm";
import type { DoctorOption } from "../pa/PatientPaForm";

export default function NewAppealRequestButton({ doctors }: { doctors: DoctorOption[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="btn btn-primary btn-sm flex-shrink-0" onClick={() => setOpen(true)}>
        + New appeal
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="New appeal">
        <PatientAppealForm doctors={doctors} />
      </Modal>
    </>
  );
}
