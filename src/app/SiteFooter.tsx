"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

export default function SiteFooter() {
  const footerRef = useRef<HTMLElement>(null);

  // Fades/slides in as it scrolls into view from below, and reverses back
  // out if you scroll back up past it -- IntersectionObserver's
  // isIntersecting already flips both ways, so no scroll-direction
  // tracking is needed, and this runs on every page that renders the
  // footer, not just the homepage (unlike LandingScripts, which only
  // loads on a few public pages).
  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;
    const observer = new IntersectionObserver(([entry]) => footer.classList.toggle("visible", entry.isIntersecting), {
      threshold: 0,
    });
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  return (
    <footer className="site-footer" ref={footerRef}>
      <div className="wrap">
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
