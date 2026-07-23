import PatientNavMenus from "./PatientNavMenus";
import type { NotificationRow } from "../dashboard/NotificationBell";

/**
 * Top strip for the patient portal -- notifications/account only. Primary
 * navigation moved to PatientSidebar.tsx (left rail); NotificationBell/
 * PatientUserMenu stay up here since their dropdown panels are positioned
 * relative to a top bar.
 */
export default function PatientNavBar({
  name,
  notifications,
}: {
  name: string;
  notifications: NotificationRow[];
}) {
  return (
    <nav className="bg-white border-b" style={{ borderColor: "var(--gray-200)" }}>
      <div className="px-5 h-14 flex items-center justify-end">
        <div className="flex items-center gap-1">
          <PatientNavMenus notifications={notifications} name={name} />
        </div>
      </div>
    </nav>
  );
}
