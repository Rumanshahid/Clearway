"use client";

import { useState } from "react";
import Link from "next/link";
import SidebarLink from "@/components/SidebarLink";
import { GridIcon, FileTextIcon, UsersIcon, FlagIcon, CalendarIcon, PenIcon, HelpCircleIcon } from "@/components/SidebarIcons";
import type { DashboardNavData } from "@/lib/dashboardNav";
import TasksBell from "./TasksBell";
import UserMenu from "./UserMenu";

// Left icon rail for the staff dashboard -- primary nav, then Tasks
// (directly under Q&A), then the account avatar pinned to the bottom.
// Chat and Notifications live in TopRightIcons.tsx instead. Stays fixed in
// place while the content column scrolls (sticky + h-screen). Expandable
// via the toggle between the logo and the first nav icon.
//
// The toggle sits in an outer wrapper alongside (not inside) <aside> --
// <aside> has overflow-y-auto for its own scrollable icon list, which was
// clipping the toggle's negative-offset poke-out at the right edge.
export default function DashboardSidebar({ data }: { data: DashboardNavData }) {
  const { isAdmin, sections, userId, userName, avatarUrl, plan, profileHref, tasks } = data;
  const showSection = (key: string) => isAdmin || sections.includes(key);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`relative flex-shrink-0 transition-[width] duration-200 ${expanded ? "w-[200px]" : "w-[68px]"}`}>
      <aside
        className={`w-full bg-white border-r flex flex-col items-center py-4 gap-1 sticky top-0 h-screen overflow-y-auto ${expanded ? "items-stretch px-3" : ""}`}
        style={{ borderColor: "var(--gray-200)" }}
      >
        <Link
          href="/doctor/dashboard"
          className={`rounded-[8px] bg-navy-900 flex items-center flex-shrink-0 mb-4 ${expanded ? "w-full h-9 px-2.5 gap-2 justify-start" : "w-9 h-9 justify-center self-center"}`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
            <path d="M2 7h10M7 2l5 5-5 5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {expanded && <span className="text-white text-[13px] font-semibold truncate">asaanbil.com</span>}
        </Link>

        {isAdmin && <SidebarLink href="/dashboard/overview" label="Dashboard" icon={<GridIcon />} expanded={expanded} />}
        {showSection("requests") && (
          <SidebarLink href="/doctor/dashboard" label="PA" icon={<FileTextIcon />} extraPrefixes={["/dashboard/requests"]} expanded={expanded} />
        )}
        {showSection("patients") && <SidebarLink href="/dashboard/patients" label="Patients" icon={<UsersIcon />} expanded={expanded} />}
        {showSection("appeals") && <SidebarLink href="/dashboard/appeals" label="Appeals" icon={<FlagIcon />} expanded={expanded} />}
        <SidebarLink href="/dashboard/appointments" label="Appointments" icon={<CalendarIcon />} expanded={expanded} />
        <SidebarLink href="/doctor/blog" label="Blog" icon={<PenIcon />} expanded={expanded} />
        <SidebarLink href="/doctor/questions" label="Q&A" icon={<HelpCircleIcon />} expanded={expanded} />
        <TasksBell tasks={tasks} />

        <div className="flex-1" />

        <UserMenu name={userName} userId={userId} avatarUrl={avatarUrl} isAdmin={isAdmin} plan={plan} profileHref={profileHref} />
      </aside>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        className="absolute top-[52px] w-6 h-6 rounded-full bg-white flex items-center justify-center transition-transform hover:scale-110 z-10"
        style={{ right: -12, border: "1px solid var(--gray-200)", boxShadow: "0 1px 3px rgba(16,24,40,0.08)", color: "var(--gray-600)" }}
      >
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ transform: expanded ? "rotate(180deg)" : undefined }}>
          <path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
