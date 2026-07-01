import Link from "next/link";
import "./landing.css";
import LandingScripts from "./LandingScripts";
import { getSiteContent } from "@/lib/criteria-repo";

const CMP_SLIDES = [
  { label: "bad", title: "30–45 minutes per letter, written from scratch", desc: "Every prior auth starts from a blank page, with staff re-typing the same structure case after case." },
  { label: "good", title: "5–10 minutes to review a criteria-matched draft", desc: "Clearway writes the first draft. Your staff reviews, edits if needed, and sends." },
  { label: "bad", title: "Guessing which clause the payer actually wants", desc: "Staff rely on memory or outdated templates to match a payer's medical necessity criteria." },
  { label: "good", title: "The exact payer clause cited automatically", desc: "Every letter references the specific CPB or guideline clause that applies to this case." },
  { label: "bad", title: "Denials discovered weeks later, care already delayed", desc: "By the time a denial letter arrives, the patient has already been waiting." },
  { label: "good", title: "Denial risks flagged before you hit submit", desc: "Missing documentation is caught and flagged at draft time, not after rejection." },
  { label: "bad", title: "Missing documentation found only after rejection", desc: "A gap in conservative-care history often isn't noticed until the denial comes back." },
  { label: "good", title: "Every request tracked — nothing falls through", desc: "A standing record of every letter, its status, and its outcome." },
];

const DEFAULTS: Record<string, string> = {
  hero_headline: "Stop writing the same letter forty times a week.",
  hero_subheadline:
    "Clearway drafts prior authorization letters from your chart notes — citing the exact medical necessity criteria each payer requires — in minutes, not hours.",
  hero_cta_primary: "Start Free Pilot",
  stat1_number: "13",
  stat1_label: "Hours Lost Weekly",
  stat1_copy: "Per physician, per week, spent on prior authorizations. (AMA, 2024)",
  stat2_number: "89%",
  stat2_label: "Rising Denials",
  stat2_copy: "Of hospital systems report rising claim denials, driven mainly by prior auth.",
  stat3_number: "82%",
  stat3_label: "Approval Rate",
  stat3_copy: "When letters explicitly cite CPB criteria, versus unstructured submissions.",
  pricing_pilot_price: "Free",
  pricing_practice_price: "$249",
  pricing_multisite_price: "Custom",
  cta_final_headline: "Bring us your next 10 prior authorizations.",
  cta_final_copy: "We'll show you what changes before you commit to anything.",
};

export default async function LandingPage() {
  const content = await getSiteContent();
  const c = (key: string) => content[key]?.value ?? DEFAULTS[key] ?? "";
  const visible = (key: string) => content[key]?.visible !== false;

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
            Clearway
          </div>
          <div className="nav-links" id="navLinks">
            <a href="#how">How It Works</a>
            <a href="#insurers">Coverage</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div className="nav-right">
            <Link className="btn btn-primary" href="/sign-up" id="navCta">Request Pilot →</Link>
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
        <a href="#how">How It Works</a>
        <a href="#insurers">Coverage</a>
        <a href="#pricing">Pricing</a>
        <div className="dd-divider"></div>
        <Link className="btn btn-primary dd-cta" href="/sign-up" style={{ display: "block", textAlign: "center" }}>Request Pilot →</Link>
      </div>

      <section className="hero">
        <div className="wrap">
          <div className="hero-grid">
            <div>
              <div className="hero-tag"><span className="tag-dot"></span>AI-Powered Prior Authorization</div>
              <h1>{c("hero_headline")}</h1>
              <p className="hero-p">{c("hero_subheadline")}</p>
              <div className="hero-btns">
                <Link className="btn btn-primary" href="/sign-up">{c("hero_cta_primary")} →</Link>
                <a className="btn btn-outline" href="#how">See How It Works</a>
              </div>
              <div className="hero-meta">
                <span>No EHR migration</span><span className="meta-sep"></span>
                <span>Human reviews every letter</span><span className="meta-sep"></span>
                <span>HIPAA-ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {visible("section_stats") && (
        <section className="stats">
          <div className="wrap">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-head"><span className="stat-label">{c("stat1_label")}</span></div>
                <div className="stat-num">{c("stat1_number")}</div>
                <div className="stat-copy">{c("stat1_copy")}</div>
              </div>
              <div className="stat-card">
                <div className="stat-head"><span className="stat-label">{c("stat2_label")}</span></div>
                <div className="stat-num">{c("stat2_number")}</div>
                <div className="stat-copy">{c("stat2_copy")}</div>
              </div>
              <div className="stat-card">
                <div className="stat-head"><span className="stat-label">{c("stat3_label")}</span></div>
                <div className="stat-num">{c("stat3_number")}</div>
                <div className="stat-copy">{c("stat3_copy")}</div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="block center" id="how">
        <div className="wrap">
          <div className="section-eyebrow">How It Works</div>
          <h2 className="section-h">From chart note to letter, in three steps.</h2>
          <p className="section-p">No new system to learn. No EHR migration. Your staff works the same way — just without the blank page and the guesswork.</p>

          <div className="how-layout">
            <div className="steps-list">
              <div className="step-item">
                <div className="step-bullet">01</div>
                <div>
                  <div className="step-title">Intake — enter the case</div>
                  <div className="step-desc">Staff fills a short intake form — diagnosis, exam findings, conservative treatment already tried. Under three minutes.</div>
                </div>
              </div>
              <div className="step-item">
                <div className="step-bullet">02</div>
                <div>
                  <div className="step-title">Draft — Clearway writes it</div>
                  <div className="step-desc">Matched against the payer&apos;s exact published medical necessity criteria. Missing fields are flagged before submission, not after a denial.</div>
                </div>
              </div>
              <div className="step-item">
                <div className="step-bullet">03</div>
                <div>
                  <div className="step-title">Review — sign and send</div>
                  <div className="step-desc">A physician reads the draft, edits as needed, and submits as usual. Clearway drafts — your clinic decides.</div>
                </div>
              </div>
            </div>

            <div className="hero-graphic">
              <div className="halo"></div>
              <div className="doc-card">
                <div className="doc-card-top">
                  <div className="doc-title-block">
                    <div className="doc-icon">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <rect x="3" y="2" width="12" height="14" rx="2" stroke="#4F46E5" strokeWidth="1.4" />
                        <path d="M6 6h6M6 9h6M6 12h4" stroke="#4F46E5" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div>
                      <div className="doc-name">PA Request #0041</div>
                      <div className="doc-id">Lumbar MRI — Aetna CPB #0236</div>
                    </div>
                  </div>
                  <div className="status-pill" id="heroChip" style={{ background: "#EEF0FF", color: "var(--indigo-600)" }}>DRAFTING</div>
                </div>
                <div className="doc-card-body">
                  <div className="criteria-block">
                    <div className="criteria-label">Criteria Match</div>
                    <div className="criteria-val accent" id="heroText">Checking conservative care history…</div>
                    <div className="progress-track"><div className="progress-fill" id="heroBar" style={{ width: "14%" }}></div></div>
                  </div>
                  <div className="criteria-block">
                    <div className="criteria-label">Documentation Flags</div>
                    <div className="criteria-val" id="heroFlag" style={{ color: "var(--gray-400)" }}>Scanning for missing fields…</div>
                  </div>
                </div>
                <div className="doc-actions">
                  <div className="doc-btn">Download PDF</div>
                  <div className="doc-btn primary" id="heroActionBtn" style={{ opacity: 0.45 }}>Review Letter →</div>
                </div>
              </div>

              <div className="float-badge" style={{ top: "-18px", right: "-18px", animation: "floatA 4s ease-in-out infinite" }}>
                <span className="fb-dot" style={{ background: "var(--success-green)" }}></span>
                <div><div className="fb-text">3/3 criteria met</div><div className="fb-sub">Aetna CPB #0236</div></div>
              </div>
              <div className="float-badge" style={{ bottom: "-18px", left: "-18px", animation: "floatB 4s ease-in-out 1.5s infinite" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8l3.5 3.5 6.5-7" stroke="#16A34A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div><div className="fb-text">Denial risk: Low</div><div className="fb-sub">Ready for review</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {visible("section_insurers") && (
      <section className="block center" id="insurers">
        <div className="wrap">
          <div className="section-eyebrow">Payer Coverage</div>
          <h2 className="section-h">We only cover what we can get right.</h2>
          <p className="section-p">Two insurers with real public criteria now. More — once a pilot gives us genuine denial data to work from, not guesswork.</p>
          <div className="ins-grid">
            <div className="ins-card">
              <div className="ins-head"><div className="ins-name">Aetna</div><div className="status-pill" style={{ background: "var(--success-bg)", color: "var(--success-green)" }}>LIVE</div></div>
              <div className="ins-desc">800+ Clinical Policy Bulletins, publicly available and mapped into Clearway. Imaging criteria all reference the exact CPB clause reviewers check for.</div>
            </div>
            <div className="ins-card">
              <div className="ins-head"><div className="ins-name">Cigna / eviCore</div><div className="status-pill" style={{ background: "var(--success-bg)", color: "var(--success-green)" }}>LIVE</div></div>
              <div className="ins-desc">eviCore manages imaging PA for Cigna and several delegated plans. Public clinical guidelines mapped into Clearway — one criteria set, multiple insurers.</div>
            </div>
            <div className="ins-card">
              <div className="ins-head"><div className="ins-name">UnitedHealthcare</div><div className="status-pill" style={{ background: "var(--amber-bg)", color: "var(--amber)" }}>SOON</div></div>
              <div className="ins-desc">UHC&apos;s criteria (InterQual) are proprietary. Coverage is being built from real client submission data — priority access if UHC is your top payer.</div>
            </div>
            <div className="ins-card">
              <div className="ins-head"><div className="ins-name">BCBS / Humana</div><div className="status-pill" style={{ background: "var(--amber-bg)", color: "var(--amber)" }}>SOON</div></div>
              <div className="ins-desc">BCBS runs 34 independent state plans; Humana relies on MCG criteria. Tell us your state and payer mix — we&apos;ll scope the right one first.</div>
            </div>
          </div>
        </div>
      </section>
      )}

      {visible("section_compare") && (
      <section className="block center">
        <div className="wrap">
          <div className="section-eyebrow">The Difference</div>
          <h2 className="section-h">What changes for your front desk.</h2>

          <div className="carousel" id="cmpCarousel">
            <button className="carousel-arrow left" id="cmpPrev" aria-label="Previous">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12.5 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button className="carousel-arrow right" id="cmpNext" aria-label="Next">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7.5 4l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>

            <div className="carousel-track">
              <div className="carousel-slides" id="cmpSlides">
                {CMP_SLIDES.map((slide, i) => (
                  <div className="cmp-slide" key={i}>
                    <div className={`cmp-slide-label ${slide.label}`}>{slide.label === "bad" ? "Without Clearway" : "With Clearway"}</div>
                    <div className="cmp-slide-title">{slide.title}</div>
                    <div className="cmp-slide-desc">{slide.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="carousel-dots" id="cmpDots"></div>
          </div>
        </div>
      </section>
      )}

      {visible("section_pricing") && (
      <section className="block center" id="pricing">
        <div className="wrap">
          <div className="section-eyebrow">Pricing</div>
          <h2 className="section-h">Earn a place before charging for it.</h2>
          <p className="section-p">Start with a free pilot. No setup fees, no contracts, no salespeople chasing you down.</p>
          <div className="price-grid">
            <div className="price-card">
              <div className="price-tier">Pilot</div>
              <div className="price-num">{c("pricing_pilot_price")}</div>
              <div className="price-sub">First 10 letters, no card required</div>
              <div className="price-divider"></div>
              <div className="price-feat"><span className="chk">✓</span>10 prior auth drafts included</div>
              <div className="price-feat"><span className="chk">✓</span>De-identified test cases</div>
              <div className="price-feat"><span className="chk">✓</span>Direct line to the founder</div>
              <div className="price-btn"><Link href="/sign-up">Start Pilot</Link></div>
            </div>
            <div className="price-card pop">
              <div className="pop-badge">Most Popular</div>
              <div className="price-tier">Practice</div>
              <div className="price-num">{c("pricing_practice_price")}<span style={{ fontSize: "16px", color: "var(--gray-400)", fontWeight: 400 }}>/mo</span></div>
              <div className="price-sub">Single-location practice</div>
              <div className="price-divider"></div>
              <div className="price-feat"><span className="chk">✓</span>Unlimited letter drafts</div>
              <div className="price-feat"><span className="chk">✓</span>Aetna + Cigna/eviCore coverage</div>
              <div className="price-feat"><span className="chk">✓</span>Missing-field flags before submit</div>
              <div className="price-feat"><span className="chk">✓</span>Request tracking dashboard</div>
              <div className="price-btn"><Link href="/sign-up">Get Started</Link></div>
            </div>
            <div className="price-card">
              <div className="price-tier">Multi-Site</div>
              <div className="price-num">{c("pricing_multisite_price")}</div>
              <div className="price-sub">Groups &amp; multi-location practices</div>
              <div className="price-divider"></div>
              <div className="price-feat"><span className="chk">✓</span>Volume-based pricing</div>
              <div className="price-feat"><span className="chk">✓</span>Extra payer criteria on request</div>
              <div className="price-feat"><span className="chk">✓</span>Dedicated onboarding</div>
              <div className="price-btn"><a href="mailto:hello@clearway.health">Talk to Us</a></div>
            </div>
          </div>
        </div>
      </section>
      )}

      <section className="cta-final" id="cta">
        <div className="wrap">
          <h2>{c("cta_final_headline")}</h2>
          <p>{c("cta_final_copy")}</p>
          <a className="btn btn-primary" href="mailto:hello@clearway.health" style={{ fontSize: "15px", padding: "14px 28px" }}>Request a Free Pilot →</a>
        </div>
      </section>

      <footer className="site-footer">
        <div className="wrap">
          <div className="footer-top">
            <div>
              <div className="footer-logo">
                <div className="footer-logo-mark">
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M7 2l5 5-5 5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                Clearway
              </div>
              <div className="footer-newsletter">
                <input className="footer-input" placeholder="Enter e-mail address" />
                <a className="btn btn-primary btn-sm" href="#">Subscribe</a>
              </div>
            </div>
          </div>
          <div className="footer-cols">
            <div className="footer-col"><h4>Product</h4><a href="#how">How It Works</a><a href="#insurers">Coverage</a><a href="#pricing">Pricing</a></div>
            <div className="footer-col"><h4>Company</h4><a href="#">About Us</a><a href="#">Contact</a><a href="#">Careers</a></div>
            <div className="footer-col"><h4>Resources</h4><a href="#">Help Center</a><a href="#">Documentation</a><a href="#">FAQs</a></div>
            <div className="footer-col"><h4>Legal</h4><a href="#">Privacy Policy</a><a href="#">Terms of Service</a><a href="#">HIPAA</a></div>
            <div className="footer-col"><h4>Payers</h4><a href="#">Aetna</a><a href="#">Cigna / eviCore</a><a href="#">Roadmap</a></div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 Clearway. Not affiliated with Aetna, Cigna, or eviCore.</span>
            <span>hello@clearway.health</span>
          </div>
        </div>
      </footer>

      <LandingScripts />
    </>
  );
}
