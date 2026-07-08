import { requireAdmin } from "@/lib/permissions";
import NavLink from "../NavLink";

export default async function SchedulingSettingsLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="max-w-[900px] mx-auto py-8 px-5">
      <h1 className="text-[24px] font-semibold mb-1">Scheduling settings</h1>
      <p className="text-[14px] text-gray-600 mb-6">
        Set up your public profile and appointment availability. Nothing here is visible to patients until you turn
        the public profile on.
      </p>

      <div className="flex gap-1 mb-6 flex-wrap" style={{ borderBottom: "1px solid var(--gray-200)" }}>
        <NavLink href="/dashboard/scheduling">Profile</NavLink>
        <NavLink href="/dashboard/scheduling/availability">Availability</NavLink>
        <NavLink href="/dashboard/scheduling/appointment-types">Appointment Types</NavLink>
        <NavLink href="/dashboard/scheduling/intake-questions">Intake Questions</NavLink>
        <NavLink href="/dashboard/scheduling/notifications">Notifications</NavLink>
      </div>

      {children}
    </div>
  );
}
