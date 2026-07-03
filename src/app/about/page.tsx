import Link from "next/link";
import "../landing.css";
import SiteNav from "../SiteNav";
import SiteFooter from "../SiteFooter";
import LandingScripts from "../LandingScripts";

export const metadata = {
  title: "About — asaanbil.com",
  description: "Why we built asaanbil.com and how we think about prior authorization.",
};

export default function AboutPage() {
  return (
    <div className="landing-root">
      <SiteNav />

      <section className="hero">
        <div className="wrap">
          <div className="hero-grid">
            <div>
              <div className="hero-tag"><span className="tag-dot"></span>About Us</div>
              <h1>Built by people tired of watching good care get stuck in paperwork.</h1>
              <p className="hero-p">
                asaanbil.com exists because prior authorization takes longer than it should, and the people paying
                for that delay are almost never the ones filling out the form.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="block center">
        <div className="wrap">
          <div className="section-eyebrow">Why We Started</div>
          <h2 className="section-h">The letter was never the hard part.</h2>
          <p className="section-p">
            Every clinic we talked to described the same pattern: a physician or a member of their staff knew
            exactly why a procedure was needed, but writing it up in the specific structure and language a payer
            reviewer expects — the right heading, the right citation, the right level of clinical detail — ate up
            time that should have gone to patients. The clinical judgment was never in question. The paperwork
            was the bottleneck.
          </p>
          <p className="section-p">
            We built asaanbil.com to close that specific gap — not to replace clinical decision-making, but to
            turn a clinician&apos;s own findings into a properly structured, criteria-backed letter in the time it takes
            to fill out a short form.
          </p>
        </div>
      </section>

      <section className="block alt center">
        <div className="wrap">
          <div className="section-eyebrow">How We Work</div>
          <h2 className="section-h">Structured, cited, and always reviewed by a human.</h2>
          <div className="how-layout">
            <div className="steps-list">
              <div className="step-item">
                <div className="step-bullet">01</div>
                <div>
                  <div className="step-title">We match every case to real criteria</div>
                  <div className="step-desc">
                    Letters are drafted against payer medical-necessity criteria we keep on file for each
                    procedure and payer combination — not generic templates.
                  </div>
                </div>
              </div>
              <div className="step-item">
                <div className="step-bullet">02</div>
                <div>
                  <div className="step-title">We flag what&apos;s missing, before it becomes a denial</div>
                  <div className="step-desc">
                    If a case is missing the documentation a payer typically expects, we say so plainly rather
                    than papering over the gap.
                  </div>
                </div>
              </div>
              <div className="step-item">
                <div className="step-bullet">03</div>
                <div>
                  <div className="step-title">A human always has the final word</div>
                  <div className="step-desc">
                    Every letter is a draft until your staff reviews, edits, and approves it. We write the first
                    version — your clinic decides what actually gets submitted.
                  </div>
                </div>
              </div>
            </div>
            <div className="ins-card" style={{ padding: "32px" }}>
              <div className="section-eyebrow" style={{ marginBottom: "14px" }}>What we believe</div>
              <p style={{ fontSize: "14px", color: "var(--gray-600)", lineHeight: 1.7 }}>
                Prior authorization exists to check that care fits the evidence — we think that check should be
                fast and legible, not a source of delay in its own right. We&apos;d rather build a tool that makes
                a clinician&apos;s existing judgment easy to document well, than one that tries to replace that
                judgment. And we&apos;d rather tell you honestly when a payer has no published criteria for a
                case than pretend we found a citation that isn&apos;t really there.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="block center">
        <div className="wrap">
          <div className="section-eyebrow">Where We&apos;re Headed</div>
          <h2 className="section-h">Starting narrow, on purpose.</h2>
          <p className="section-p">
            We launched with imaging prior authorizations for the payers where genuinely public, citable
            criteria exist — because a tool that cites real criteria for two payers is worth more than one that
            guesses at all of them. Coverage grows as we validate each addition against real submissions, not
            before.
          </p>
        </div>
      </section>

      <section className="cta-final" id="cta">
        <div className="wrap">
          <h2>Bring us your next 10 prior authorizations.</h2>
          <p>We&apos;ll show you what changes before you commit to anything.</p>
          <Link className="btn btn-primary" href="/sign-up" style={{ fontSize: "15px", padding: "14px 28px" }}>Start Free Pilot →</Link>
        </div>
      </section>

      <SiteFooter />
      <LandingScripts />
    </div>
  );
}
