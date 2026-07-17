export interface PatientDashboardSectionDef {
  key: string;
  title: string;
}

export const PATIENT_DASHBOARD_SECTIONS: PatientDashboardSectionDef[] = [
  { key: "appointments", title: "Recent Appointments" },
  { key: "medical_history", title: "Medical History" },
  { key: "allowed_doctors", title: "Allowed Doctors" },
  { key: "allergies", title: "Allergies & Medications" },
  { key: "insurance", title: "Insurance Details" },
];
