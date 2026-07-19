// Client-safe section constants — kept separate from lib/permissions.ts,
// whose guards import the server-only Supabase client and therefore can't
// be pulled into "use client" components.

export const DASHBOARD_SECTIONS = [
  { key: "requests", label: "PA Requests", href: "/doctor/dashboard" },
  { key: "patients", label: "Patients", href: "/dashboard/patients" },
  { key: "appeals", label: "Appeals", href: "/dashboard/appeals" },
] as const;

export type SectionKey = (typeof DASHBOARD_SECTIONS)[number]["key"];
