import { redirect } from "next/navigation";

// The separate patient "Home"/Dashboard page was merged into
// /patient/profile (recent appointments, Allowed Doctors, allergies,
// insurance, and the profile fields all live there now) -- this route
// stays only so old links/bookmarks to /patient don't 404.
export default function PatientRootRedirect() {
  redirect("/patient/profile");
}
