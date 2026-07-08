import Link from "next/link";
import { getSiteContent } from "@/lib/criteria-repo";
import { getPageBySlug, makeFieldGetter } from "@/lib/content-schema";

const NAV_PAGE = getPageBySlug("nav")!;

export default async function SiteNav() {
  const content = await getSiteContent();
  const c = makeFieldGetter(NAV_PAGE, content);

  return (
    <>
      <nav className="site-nav" id="siteNav">
        <div className="wrap">
          <div className="logo">
            <div className="logo-mark">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M7 2l5 5-5 5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            {c("nav_logo_text")}
          </div>
          <div className="nav-links" id="navLinks">
            <Link href="/#how">{c("nav_link_how")}</Link>
            <Link href="/#insurers">{c("nav_link_coverage")}</Link>
            <Link href="/#pricing">{c("nav_link_pricing")}</Link>
            <Link href="/doctors">Find a Doctor</Link>
            <Link href="/about">{c("nav_link_about")}</Link>
          </div>
          <div className="nav-right">
            <Link className="btn btn-text" href="/sign-in" id="navSignIn">{c("nav_signin_label")}</Link>
            <Link className="btn btn-primary" href="/sign-up" id="navCta">{c("nav_signup_label")}</Link>
            <button className="hamburger" id="mobileHamburger" aria-label="Open menu">
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
      </nav>

      <button className="floating-menu-btn" id="floatingHamburger" aria-label="Open menu">
        <span></span><span></span><span></span>
      </button>
      <div className="nav-dropdown" id="navDropdown">
        <Link href="/#how">{c("nav_link_how")}</Link>
        <Link href="/#insurers">{c("nav_link_coverage")}</Link>
        <Link href="/#pricing">{c("nav_link_pricing")}</Link>
        <Link href="/doctors">Find a Doctor</Link>
        <Link href="/about">{c("nav_link_about")}</Link>
        <div className="dd-divider"></div>
        <Link className="btn btn-outline dd-cta" href="/sign-in" style={{ display: "block", textAlign: "center", marginBottom: "8px" }}>{c("nav_signin_label")}</Link>
        <Link className="btn btn-primary dd-cta" href="/sign-up" style={{ display: "block", textAlign: "center" }}>{c("nav_signup_label")}</Link>
      </div>
    </>
  );
}
