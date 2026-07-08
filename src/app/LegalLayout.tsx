import SiteNav from "./SiteNav";
import SiteFooter from "./SiteFooter";
import LandingScripts from "./LandingScripts";

export default function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="landing-root">
      <SiteNav />

      <div className="wrap" style={{ maxWidth: 760, padding: "56px 40px 80px" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 8 }}>{title}</h1>
        <p style={{ fontSize: 13, color: "var(--gray-400)", marginBottom: 40 }}>Last updated: {updated}</p>
        <div className="legal-body">{children}</div>
      </div>

      <SiteFooter />
      <LandingScripts />
    </div>
  );
}
