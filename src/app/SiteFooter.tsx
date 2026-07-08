import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-top">
          <div>
            <div className="footer-logo">
              <div className="footer-logo-mark">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M7 2l5 5-5 5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              asaanbil.com
            </div>
            <div className="footer-newsletter">
              <input className="footer-input" placeholder="Enter e-mail address" />
              <a className="btn btn-primary btn-sm" href="#">Subscribe</a>
            </div>
          </div>
        </div>
        <div className="footer-cols">
          <div className="footer-col"><h4>Product</h4><Link href="/#how">How It Works</Link><Link href="/#insurers">Coverage</Link><Link href="/#pricing">Pricing</Link></div>
          <div className="footer-col"><h4>Company</h4><Link href="/about">About Us</Link><a href="mailto:hello@asaanbil.com">Contact</a><a href="#">Careers</a></div>
          <div className="footer-col"><h4>Resources</h4><a href="#">Help Center</a><a href="#">Documentation</a><a href="#">FAQs</a></div>
          <div className="footer-col"><h4>Legal</h4><Link href="/privacy">Privacy Policy</Link><Link href="/terms">Terms of Service</Link><Link href="/refund-policy">Refund Policy</Link><Link href="/privacy#hipaa">HIPAA</Link></div>
          <div className="footer-col"><h4>Payers</h4><a href="#">Aetna</a><a href="#">Cigna / eviCore</a><a href="#">Roadmap</a></div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 asaanbil.com. Not affiliated with Aetna, Cigna, or eviCore.</span>
          <span>hello@asaanbil.com</span>
        </div>
      </div>
    </footer>
  );
}
