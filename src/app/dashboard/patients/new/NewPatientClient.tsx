"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import PatientForm from "../PatientForm";
import type { SavedPhysician } from "@/app/dashboard/requests/new/NewRequestForm";
import { buildPatientCsvTemplate } from "@/lib/patients";
import { createPatientAction, importPatientsCsvAction } from "./actions";

function ImportSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary" type="submit" disabled={pending}>
      {pending ? "Importing…" : "Import patients"}
    </button>
  );
}

function downloadTemplate() {
  const blob = new Blob([buildPatientCsvTemplate()], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "patient-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function NewPatientClient({ physicians }: { physicians: SavedPhysician[] }) {
  const [mode, setMode] = useState<"manual" | "migration">("manual");

  return (
    <div>
      <div className="mb-6">
        <div className="inline-flex rounded-[10px] border overflow-hidden" style={{ borderColor: "var(--gray-200)" }}>
          <button
            type="button"
            className="px-4 py-2 text-[13px] font-medium transition-colors"
            style={mode === "manual" ? { background: "var(--indigo-600)", color: "#fff" } : { background: "#fff", color: "var(--gray-600)" }}
            onClick={() => setMode("manual")}
          >
            Add manually
          </button>
          <button
            type="button"
            className="px-4 py-2 text-[13px] font-medium transition-colors"
            style={mode === "migration" ? { background: "var(--indigo-600)", color: "#fff" } : { background: "#fff", color: "var(--gray-600)" }}
            onClick={() => setMode("migration")}
          >
            Migration
          </button>
        </div>
      </div>

      {mode === "manual" ? (
        <PatientForm formAction={createPatientAction} physicians={physicians} submitLabel="Add patient" />
      ) : (
        <div className="card p-6 max-w-[600px]">
          <h2 className="text-[15px] font-semibold mb-1">Bulk import from CSV</h2>
          <p className="text-[12.5px] text-gray-400 mb-4">
            Required columns: first_name, last_name, dob (YYYY-MM-DD), gender. All other columns are optional —
            unrecognized columns are ignored, and rows missing a required field are skipped and reported after import.
          </p>
          <button type="button" className="text-btn text-[13px] text-indigo-600 font-medium mb-4" onClick={downloadTemplate}>
            Download CSV template →
          </button>
          <form action={importPatientsCsvAction} className="flex flex-col gap-4">
            <div>
              <label className="label" htmlFor="csv_file">CSV file</label>
              <input className="input" id="csv_file" name="csv_file" type="file" accept=".csv,text/csv" required />
            </div>
            <ImportSubmitButton />
          </form>
        </div>
      )}
    </div>
  );
}
