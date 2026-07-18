import Link from "next/link";
import NavLink from "../dashboard/NavLink";
import PatientNavMenus from "./PatientNavMenus";
import type { NotificationRow } from "../dashboard/NotificationBell";

export default function PatientNavBar({
  name,
  notifications,
}: {
  name: string;
  notifications: NotificationRow[];
}) {
  return (
    <nav className="bg-white border-b" style={{ borderColor: "var(--gray-200)" }}>
      <div className="max-w-[1300px] mx-auto px-5 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/patient" className="flex items-center gap-2">
            <span className="w-[24px] h-[24px] rounded-[6px] bg-navy-900 flex items-center justify-center flex-shrink-0">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M7 2l5 5-5 5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-[17px] font-semibold text-gray-900">asaanbil.com</span>
              <span className="text-[10.5px] text-gray-400 uppercase tracking-wide">Patient</span>
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <NavLink href="/patient/profile">Profile</NavLink>
            <NavLink href="/patient/pa">PA</NavLink>
            <NavLink href="/patient/appeals">Appeals</NavLink>
            <NavLink href="/doctors">Find a Doctor</NavLink>
            <NavLink href="/blog">Blog</NavLink>
            <NavLink href="/questions">Q&amp;A</NavLink>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <PatientNavMenus notifications={notifications} name={name} />
        </div>
      </div>
    </nav>
  );
}
