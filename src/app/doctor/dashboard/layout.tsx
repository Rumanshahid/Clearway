// Reuses the exact same nav bar / billing-banner / auth-guard layout as the
// rest of the staff dashboard -- this route lives physically under
// src/app/doctor/ (not src/app/dashboard/) so it wouldn't otherwise inherit
// dashboard/layout.tsx automatically.
export { default } from "@/app/dashboard/layout";
