import Link from "next/link";
import SidebarLink from "@/components/SidebarLink";
import { UserIcon, FileTextIcon, FlagIcon, SearchIcon, PenIcon, HelpCircleIcon } from "@/components/SidebarIcons";
import PatientUserMenu from "./PatientUserMenu";

export default function PatientSidebar({
  userId,
  name,
  avatarUrl,
}: {
  userId: string;
  name: string;
  avatarUrl: string | null;
}) {
  return (
    <aside className="w-[68px] flex-shrink-0 bg-white border-r flex flex-col items-center py-4 gap-1 sticky top-0 h-screen overflow-y-auto" style={{ borderColor: "var(--gray-200)" }}>
      <Link href="/patient/profile" className="w-9 h-9 rounded-[8px] bg-navy-900 flex items-center justify-center flex-shrink-0 mb-4">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 7h10M7 2l5 5-5 5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>

      <SidebarLink href="/patient/profile" label="Profile" icon={<UserIcon />} />
      <SidebarLink href="/patient/pa" label="PA" icon={<FileTextIcon />} />
      <SidebarLink href="/patient/appeals" label="Appeals" icon={<FlagIcon />} />
      <SidebarLink href="/patient/doctor" label="Find a Doctor" icon={<SearchIcon />} />
      <SidebarLink href="/patient/blog" label="Blog" icon={<PenIcon />} />
      <SidebarLink href="/patient/questions" label="Q&A" icon={<HelpCircleIcon />} />

      <div className="flex-1" />

      <PatientUserMenu name={name} userId={userId} avatarUrl={avatarUrl} />
    </aside>
  );
}
