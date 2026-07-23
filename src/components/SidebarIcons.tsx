// Minimal single-stroke icon set for the left sidebar rails (staff/patient/
// admin) -- consistent with the rest of the app's hand-rolled inline SVGs
// rather than pulling in an icon library.
type IconProps = { size?: number };

const base = { fill: "none" as const, stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function GridIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function FileTextIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M6 3.5h8l5 5V19a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 016 19V5A1.5 1.5 0 016 3.5z" />
      <path d="M14 3.5V8h5" />
      <path d="M9 13h6M9 16.5h6" />
    </svg>
  );
}

export function UsersIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20c0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6" />
      <circle cx="17" cy="8.5" r="2.5" />
      <path d="M15.5 14.3c2.6.3 4.6 2.7 4.6 5.7" />
    </svg>
  );
}

export function FlagIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M5.5 21V4" />
      <path d="M5.5 5c1.5-1 3.3-1 5 0s3.5 1 5 0v9c-1.5 1-3.3 1-5 0s-3.5-1-5 0V5z" />
    </svg>
  );
}

export function CalendarIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M3.5 9.5h17" />
    </svg>
  );
}

export function PenIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M4 20l1-4.2L15.8 5a1.5 1.5 0 012.1 0l1.1 1.1a1.5 1.5 0 010 2.1L8.2 19 4 20z" />
      <path d="M13.5 6.5l4 4" />
    </svg>
  );
}

export function HelpCircleIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 9.3a2.4 2.4 0 114.15 1.65c-.7.62-1.75 1.05-1.75 2.35" />
      <circle cx="12" cy="16.7" r="0.15" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SearchIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.3-4.3" />
    </svg>
  );
}

export function UserIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20c0-4 3.4-7 7.5-7s7.5 3 7.5 7" />
    </svg>
  );
}

export function BarChartIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M5 20V10M12 20V4M19 20v-7" />
    </svg>
  );
}

export function BuildingIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <rect x="5" y="3.5" width="14" height="17" rx="1.5" />
      <path d="M9 8h.01M12 8h.01M15 8h.01M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01" strokeWidth="2.6" />
    </svg>
  );
}

export function ListChecksIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M4 6l1.5 1.5L8 5" />
      <path d="M4 12l1.5 1.5L8 11" />
      <path d="M4 18l1.5 1.5L8 17" />
      <path d="M11.5 6h9M11.5 12h9M11.5 18h9" />
    </svg>
  );
}

export function TerminalIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M7 9.5l3 3-3 3M12.5 15.5h4.5" />
    </svg>
  );
}

export function DollarIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M12 3v18" />
      <path d="M16.5 7.5c0-1.8-2-2.8-4.5-2.8s-4.5 1-4.5 2.6c0 3.6 9 1.5 9 5.4 0 1.8-2.2 2.8-4.5 2.8s-4.6-1-4.6-2.8" />
    </svg>
  );
}

export function FileEditIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M13 3.5H6.5A1.5 1.5 0 005 5v14a1.5 1.5 0 001.5 1.5h11A1.5 1.5 0 0019 19v-7" />
      <path d="M20.4 5.6a1.4 1.4 0 00-2-2L12 10v2.4h2.4l6-6.8z" />
    </svg>
  );
}

export function ClockShieldIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function ArrowLeftIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

export function LogOutIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M9 4H6.5A1.5 1.5 0 005 5.5v13A1.5 1.5 0 006.5 20H9" />
      <path d="M14 8l4 4-4 4M18 12H9" />
    </svg>
  );
}
