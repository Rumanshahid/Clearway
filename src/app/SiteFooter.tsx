import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-top">
          <div className="footer-logo">
            <div className="footer-logo-mark">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M7 2l5 5-5 5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            asaanbil.com
          </div>
        </div>
        <div className="footer-links">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/refund-policy">Refund Policy</Link>
          <Link href="/privacy#hipaa">HIPAA</Link>
        </div>
        <div className="footer-bottom">
          <span>© 2026 asaanbil.com. Not affiliated with Aetna, Cigna, or eviCore.</span>
          <a href="mailto:hello@asaanbil.com">hello@asaanbil.com</a>
        </div>
      </div>
    </footer>
  );
}
