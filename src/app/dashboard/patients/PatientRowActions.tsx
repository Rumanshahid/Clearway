"use client";

import { deletePatientAction } from "./new/actions";

export default function PatientRowActions({ patientId }: { patientId: string }) {
  return (
    <div className="flex items-center gap-3">
      <a
        href={`/api/patients/${patientId}/pdf`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-btn text-gray-400 hover:text-indigo-600"
        aria-label="Download patient info"
        title="Download patient info"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 2v8m0 0l-3-3m3 3l3-3M3 12v1.5A1.5 1.5 0 004.5 15h7a1.5 1.5 0 001.5-1.5V12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
      <form
        action={deletePatientAction.bind(null, patientId)}
        onSubmit={(e) => {
          if (!confirm("Delete this patient? This can't be undone. Any linked PA requests or claim denials will keep their own record, just unlinked from this patient.")) {
            e.preventDefault();
          }
        }}
      >
        <button
          type="submit"
          className="text-btn text-gray-400 hover:text-[var(--danger-red)]"
          aria-label="Delete patient"
          title="Delete patient"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 4.5h10M6.5 4.5V3a1 1 0 011-1h1a1 1 0 011 1v1.5M4.5 4.5V13a1 1 0 001 1h5a1 1 0 001-1V4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
    </div>
  );
}
