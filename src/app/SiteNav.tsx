import Link from "next/link";

export default function SiteNav() {
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
            asaanbil.com
          </div>
          <div className="nav-links" id="navLinks">
            <Link href="/#how">How It Works</Link>
            <Link href="/#insurers">Coverage</Link>
            <Link href="/#pricing">Pricing</Link>
            <Link href="/about">About</Link>
          </div>
          <div className="nav-right">
            <Link className="btn btn-text" href="/sign-in" id="navSignIn">Sign In</Link>
            <Link className="btn btn-primary" href="/sign-up" id="navCta">Sign Up</Link>
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
        <Link href="/#how">How It Works</Link>
        <Link href="/#insurers">Coverage</Link>
        <Link href="/#pricing">Pricing</Link>
        <Link href="/about">About</Link>
        <div className="dd-divider"></div>
        <Link className="btn btn-outline dd-cta" href="/sign-in" style={{ display: "block", textAlign: "center", marginBottom: "8px" }}>Sign In</Link>
        <Link className="btn btn-primary dd-cta" href="/sign-up" style={{ display: "block", textAlign: "center" }}>Sign Up</Link>
      </div>
    </>
  );
}
