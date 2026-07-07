import Link from "next/link";
import "../landing.css";
import SiteNav from "../SiteNav";
import SiteFooter from "../SiteFooter";
import LandingScripts from "../LandingScripts";
import { getSiteContent } from "@/lib/criteria-repo";
import { getPageBySlug, makeFieldGetter } from "@/lib/content-schema";

const ABOUT_PAGE = getPageBySlug("about")!;

export const metadata = {
  title: "About — asaanbil.com",
  description: "Why we built asaanbil.com and how we think about prior authorization.",
};

export default async function AboutPage() {
  const content = await getSiteContent();
  const c = makeFieldGetter(ABOUT_PAGE, content);

  return (
    <div className="landing-root">
      <SiteNav />

      <section className="hero">
        <div className="wrap">
          <div className="hero-grid">
            <div>
              <div className="hero-tag"><span className="tag-dot"></span>{c("about_hero_tag")}</div>
              <h1>{c("about_hero_headline")}</h1>
              <p className="hero-p">{c("about_hero_copy")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="block center">
        <div className="wrap">
          <div className="section-eyebrow">{c("about_why_eyebrow")}</div>
          <h2 className="section-h">{c("about_why_h2")}</h2>
          <p className="section-p">{c("about_why_p1")}</p>
          <p className="section-p">{c("about_why_p2")}</p>
        </div>
      </section>

      <section className="block alt center">
        <div className="wrap">
          <div className="section-eyebrow">{c("about_how_eyebrow")}</div>
          <h2 className="section-h">{c("about_how_h2")}</h2>
          <div className="how-layout">
            <div className="steps-list">
              <div className="step-item">
                <div className="step-bullet">01</div>
                <div>
                  <div className="step-title">{c("about_how_step1_title")}</div>
                  <div className="step-desc">{c("about_how_step1_desc")}</div>
                </div>
              </div>
              <div className="step-item">
                <div className="step-bullet">02</div>
                <div>
                  <div className="step-title">{c("about_how_step2_title")}</div>
                  <div className="step-desc">{c("about_how_step2_desc")}</div>
                </div>
              </div>
              <div className="step-item">
                <div className="step-bullet">03</div>
                <div>
                  <div className="step-title">{c("about_how_step3_title")}</div>
                  <div className="step-desc">{c("about_how_step3_desc")}</div>
                </div>
              </div>
            </div>
            <div className="ins-card" style={{ padding: "32px" }}>
              <div className="section-eyebrow" style={{ marginBottom: "14px" }}>{c("about_how_belief_eyebrow")}</div>
              <p style={{ fontSize: "14px", color: "var(--gray-600)", lineHeight: 1.7 }}>{c("about_how_belief_copy")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="block center">
        <div className="wrap">
          <div className="section-eyebrow">{c("about_headed_eyebrow")}</div>
          <h2 className="section-h">{c("about_headed_h2")}</h2>
          <p className="section-p">{c("about_headed_copy")}</p>
        </div>
      </section>

      <section className="cta-final" id="cta">
        <div className="wrap">
          <h2>{c("about_cta_headline")}</h2>
          <p>{c("about_cta_copy")}</p>
          <Link className="btn btn-primary" href="/sign-up" style={{ fontSize: "15px", padding: "14px 28px" }}>{c("about_cta_button")} →</Link>
        </div>
      </section>

      <SiteFooter />
      <LandingScripts />
    </div>
  );
}
