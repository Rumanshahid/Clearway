import Link from "next/link";
import "./landing.css";
import LandingScripts from "./LandingScripts";
import SiteNav from "./SiteNav";
import SiteFooter from "./SiteFooter";
import { getSiteContent } from "@/lib/criteria-repo";
import { getPageBySlug, makeFieldGetter, sectionVisible } from "@/lib/content-schema";

const HOME_PAGE = getPageBySlug("home")!;
const sectionByTitle = (title: string) => HOME_PAGE.sections.find((s) => s.title === title)!;

export default async function LandingPage() {
  const content = await getSiteContent();
  const c = makeFieldGetter(HOME_PAGE, content);
  const visible = (title: string) => sectionVisible(content, sectionByTitle(title));

  const cmpSlides = [1, 2, 3, 4].map((n) => ({
    before: c(`cmp${n}_before`),
    em: c(`cmp${n}_em`),
    after: c(`cmp${n}_after`),
  }));

  return (
    <div className="landing-root">
      <SiteNav />

      <section className="hero">
        <div className="wrap">
          <div className="hero-grid">
            <div>
              <div className="hero-tag"><span className="tag-dot"></span>{c("hero_tag")}</div>
              <h1>{c("hero_headline")}</h1>
              <p className="hero-p">{c("hero_subheadline")}</p>
              <div className="hero-btns">
                <Link className="btn btn-primary" href="/sign-up">{c("hero_cta_primary")} →</Link>
                <a className="btn btn-outline" href="#how">{c("hero_cta_secondary")}</a>
              </div>
              <div className="hero-meta">
                <span>{c("hero_meta_1")}</span><span className="meta-sep"></span>
                <span>{c("hero_meta_2")}</span><span className="meta-sep"></span>
                <span>{c("hero_meta_3")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {visible("Stats section") && (
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
          <div className="section-eyebrow">{c("how_eyebrow")}</div>
          <h2 className="section-h">{c("how_h2")}</h2>
          <p className="section-p">{c("how_intro")}</p>

          <div className="how-layout">
            <div className="steps-list">
              <div className="step-item">
                <div className="step-bullet">01</div>
                <div>
                  <div className="step-title">{c("how_step1_title")}</div>
                  <div className="step-desc">{c("how_step1_desc")}</div>
                </div>
              </div>
              <div className="step-item">
                <div className="step-bullet">02</div>
                <div>
                  <div className="step-title">{c("how_step2_title")}</div>
                  <div className="step-desc">{c("how_step2_desc")}</div>
                </div>
              </div>
              <div className="step-item">
                <div className="step-bullet">03</div>
                <div>
                  <div className="step-title">{c("how_step3_title")}</div>
                  <div className="step-desc">{c("how_step3_desc")}</div>
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

      {visible("Payer coverage section") && (
      <section className="block alt center" id="insurers">
        <div className="wrap">
          <div className="section-eyebrow">{c("insurers_eyebrow")}</div>
          <h2 className="section-h">{c("insurers_h2")}</h2>
          <p className="section-p">{c("insurers_intro")}</p>
          <div className="ins-grid">
            <div className="ins-card">
              <div className="ins-head"><div className="ins-name">{c("insurer1_name")}</div><div className="status-pill" style={{ background: "var(--success-bg)", color: "var(--success-green)" }}>LIVE</div></div>
              <div className="ins-desc">{c("insurer1_desc")}</div>
            </div>
            <div className="ins-card">
              <div className="ins-head"><div className="ins-name">{c("insurer2_name")}</div><div className="status-pill" style={{ background: "var(--success-bg)", color: "var(--success-green)" }}>LIVE</div></div>
              <div className="ins-desc">{c("insurer2_desc")}</div>
            </div>
            <div className="ins-card">
              <div className="ins-head"><div className="ins-name">{c("insurer3_name")}</div><div className="status-pill" style={{ background: "var(--success-bg)", color: "var(--success-green)" }}>LIVE</div></div>
              <div className="ins-desc">{c("insurer3_desc")}</div>
            </div>
            <div className="ins-card">
              <div className="ins-head"><div className="ins-name">{c("insurer4_name")}</div><div className="status-pill" style={{ background: "var(--success-bg)", color: "var(--success-green)" }}>LIVE</div></div>
              <div className="ins-desc">{c("insurer4_desc")}</div>
            </div>
            <div className="ins-card">
              <div className="ins-head"><div className="ins-name">{c("insurer5_name")}</div><div className="status-pill" style={{ background: "var(--success-bg)", color: "var(--success-green)" }}>LIVE</div></div>
              <div className="ins-desc">{c("insurer5_desc")}</div>
            </div>
            <div className="ins-card">
              <div className="ins-head"><div className="ins-name">{c("insurer6_name")}</div><div className="status-pill" style={{ background: "var(--success-bg)", color: "var(--success-green)" }}>LIVE</div></div>
              <div className="ins-desc">{c("insurer6_desc")}</div>
            </div>
            <div className="ins-card">
              <div className="ins-head"><div className="ins-name">{c("insurer7_name")}</div><div className="status-pill" style={{ background: "var(--success-bg)", color: "var(--success-green)" }}>LIVE</div></div>
              <div className="ins-desc">{c("insurer7_desc")}</div>
            </div>
          </div>
        </div>
      </section>
      )}

      {visible("Comparison carousel") && (
      <section className="block center">
        <div className="wrap">
          <div className="section-eyebrow">{c("compare_eyebrow")}</div>
          <h2 className="section-h">{c("compare_h2")}</h2>

          <div className="carousel" id="cmpCarousel">
            <button className="carousel-arrow left" id="cmpPrev" aria-label="Previous">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12.5 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button className="carousel-arrow right" id="cmpNext" aria-label="Next">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7.5 4l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>

            <div className="carousel-track">
              <div className="carousel-slides" id="cmpSlides">
                {cmpSlides.map((slide, i) => (
                  <div className="cmp-slide" key={i}>
                    <div className="cmp-slide-desc">{slide.before}<em>{slide.em}</em>{slide.after}</div>
                  </div>
                ))}
                {/* clone of slide 1, used to fake an infinite forward loop */}
                <div className="cmp-slide" aria-hidden="true">
                  <div className="cmp-slide-desc">{cmpSlides[0].before}<em>{cmpSlides[0].em}</em>{cmpSlides[0].after}</div>
                </div>
              </div>
            </div>

            <div className="carousel-dots" id="cmpDots"></div>
          </div>
        </div>
      </section>
      )}

      {visible("Pricing section") && (
      <section className="block alt center" id="pricing">
        <div className="wrap">
          <div className="section-eyebrow">{c("pricing_eyebrow")}</div>
          <h2 className="section-h">{c("pricing_h2")}</h2>
          <p className="section-p">{c("pricing_intro")}</p>
          <div className="price-grid">
            <div className="price-card">
              <div className="price-tier">Pilot</div>
              <div className="price-num">{c("pricing_pilot_price")}</div>
              <div className="price-sub">{c("pricing_pilot_sub")}</div>
              <div className="price-divider"></div>
              <div className="price-feat"><span className="chk">✓</span>10 prior auth drafts included</div>
              <div className="price-feat"><span className="chk">✓</span>De-identified test cases</div>
              <div className="price-feat"><span className="chk">✓</span>Direct line to the founder</div>
              <div className="price-btn"><Link href="/sign-up">{c("pricing_pilot_cta")}</Link></div>
            </div>
            <div className="price-card pop">
              <div className="pop-badge">Most Popular</div>
              <div className="price-tier">Practice</div>
              <div className="price-num">{c("pricing_practice_price")}<span style={{ fontSize: "16px", color: "var(--gray-400)", fontWeight: 400 }}>/mo</span></div>
              <div className="price-sub">{c("pricing_practice_sub")}</div>
              <div className="price-divider"></div>
              <div className="price-feat"><span className="chk">✓</span>Unlimited letter drafts</div>
              <div className="price-feat"><span className="chk">✓</span>Aetna + Cigna/eviCore coverage</div>
              <div className="price-feat"><span className="chk">✓</span>Missing-field flags before submit</div>
              <div className="price-feat"><span className="chk">✓</span>Request tracking dashboard</div>
              <div className="price-btn"><Link href="/sign-up">{c("pricing_practice_cta")}</Link></div>
            </div>
            <div className="price-card">
              <div className="price-tier">Multi-Site</div>
              <div className="price-num">{c("pricing_multisite_price")}</div>
              <div className="price-sub">{c("pricing_multisite_sub")}</div>
              <div className="price-divider"></div>
              <div className="price-feat"><span className="chk">✓</span>Volume-based pricing</div>
              <div className="price-feat"><span className="chk">✓</span>Extra payer criteria on request</div>
              <div className="price-feat"><span className="chk">✓</span>Dedicated onboarding</div>
              <div className="price-btn"><a href="mailto:hello@asaanbil.com">{c("pricing_multisite_cta")}</a></div>
            </div>
          </div>
        </div>
      </section>
      )}

      <section className="cta-final" id="cta">
        <div className="wrap">
          <h2>{c("cta_final_headline")}</h2>
          <p>{c("cta_final_copy")}</p>
          <a className="btn btn-primary" href="mailto:hello@asaanbil.com" style={{ fontSize: "15px", padding: "14px 28px" }}>{c("cta_final_button")} →</a>
        </div>
      </section>

      <SiteFooter />

      <LandingScripts />
    </div>
  );
}
