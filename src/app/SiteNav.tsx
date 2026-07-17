import Link from "next/link";
import { getSiteContent } from "@/lib/criteria-repo";
import { getPageBySlug, makeFieldGetter } from "@/lib/content-schema";
import { createClient } from "@/lib/supabase/server";
import NavSearch from "./NavSearch";

const NAV_PAGE = getPageBySlug("nav")!;

export default async function SiteNav() {
  const content = await getSiteContent();
  const c = makeFieldGetter(NAV_PAGE, content);

  // This nav renders on every public/marketing page, including ones a
  // signed-in doctor now visits regularly (their own /doctors/[slug]
  // page) -- without this check it always showed Sign In/Sign Up even to
  // someone already logged in.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // A patient_accounts identity has no `profiles` row/practice_id -- sending
  // one to /dashboard bounces them straight to the practice-setup wizard
  // (see resolvePostLoginPath), which is wrong for a signed-in patient.
  let dashboardHref = "/dashboard";
  if (user) {
    const { data: patientAccount } = await supabase.from("patient_accounts").select("id").eq("id", user.id).maybeSingle();
    if (patientAccount) dashboardHref = "/patient";
  }

  return (
    <>
      <nav className="site-nav" id="siteNav">
        <div className="wrap">
          <Link href="https://www.asaanbil.com/" className="logo">
            <div className="logo-mark">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M7 2l5 5-5 5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            {c("nav_logo_text")}
          </Link>
          <div className="nav-links" id="navLinks">
            <Link href="/">Home</Link>
            <Link href="/#pricing">{c("nav_link_pricing")}</Link>
            <Link href="/doctors">Find a Doctor</Link>
            <Link href="/blog">{c("nav_link_blog")}</Link>
            <Link href="/questions">Q&amp;A</Link>
            <Link href="/about">{c("nav_link_about")}</Link>
          </div>
          <div className="nav-right">
            <NavSearch />
            {user ? (
              <Link className="btn btn-primary" href={dashboardHref} id="navCta">Go to Dashboard</Link>
            ) : (
              <>
                <Link className="btn btn-text" href="/sign-in" id="navSignIn">{c("nav_signin_label")}</Link>
                <Link className="btn btn-primary" href="/sign-up" id="navCta">{c("nav_signup_label")}</Link>
              </>
            )}
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
        <form action="/search" method="GET" className="flex gap-2 mb-3">
          <input className="input" type="search" name="q" placeholder="Search…" aria-label="Search" />
          <button type="submit" className="btn btn-outline flex-shrink-0" aria-label="Search">
            <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
              <circle cx="6.5" cy="6.5" r="4.5" stroke="var(--gray-600)" strokeWidth="1.4" />
              <path d="M10 10l3.5 3.5" stroke="var(--gray-600)" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </form>
        <Link href="/">Home</Link>
        <Link href="/#pricing">{c("nav_link_pricing")}</Link>
        <Link href="/doctors">Find a Doctor</Link>
        <Link href="/blog">{c("nav_link_blog")}</Link>
        <Link href="/questions">Q&amp;A</Link>
        <Link href="/about">{c("nav_link_about")}</Link>
        <div className="dd-divider"></div>
        {user ? (
          <Link className="btn btn-primary dd-cta" href={dashboardHref} style={{ display: "block", textAlign: "center" }}>Go to Dashboard</Link>
        ) : (
          <>
            <Link className="btn btn-outline dd-cta" href="/sign-in" style={{ display: "block", textAlign: "center", marginBottom: "8px" }}>{c("nav_signin_label")}</Link>
            <Link className="btn btn-primary dd-cta" href="/sign-up" style={{ display: "block", textAlign: "center" }}>{c("nav_signup_label")}</Link>
          </>
        )}
      </div>
    </>
  );
}
