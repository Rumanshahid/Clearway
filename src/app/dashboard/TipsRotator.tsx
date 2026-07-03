"use client";

import { useEffect, useState } from "react";
import { getRandomTip, TIPS } from "@/lib/tips";

const CATEGORY_LABEL: Record<string, string> = {
  denial: "Denial guide",
  deadline: "Deadline",
  success: "Verified",
  voice: "Writing tip",
};

const CATEGORY_STYLE: Record<string, { bg: string; color: string }> = {
  denial: { bg: "var(--amber-bg)", color: "var(--amber)" },
  deadline: { bg: "#EEF0FF", color: "var(--indigo-600)" },
  success: { bg: "var(--success-bg)", color: "var(--success-green)" },
  voice: { bg: "var(--gray-100)", color: "var(--gray-600)" },
};

export default function TipsRotator({ className }: { className?: string }) {
  // Seeded with a fixed tip (index 0) so server and client render identical
  // HTML on the first pass — picking randomly here would mismatch between
  // the server's render and the client's hydration render and crash the
  // page (React error #418). The real random pick happens client-only,
  // after mount, in the effect below.
  const [{ tip }, setCurrent] = useState<{ tip: (typeof TIPS)[number]; index: number }>({ tip: TIPS[0], index: 0 });
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // One deliberate extra render to swap the deterministic SSR tip for a
    // real random one, client-only — this is the standard fix for a
    // server/client value mismatch, not an accidental cascading update.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrent(getRandomTip());

    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrent((prev) => getRandomTip(prev.index));
        setVisible(true);
      }, 220);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`card p-4 ${className || ""}`}>
      <div
        className="flex items-start gap-3 transition-opacity duration-200"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <span
          className="status-pill flex-shrink-0"
          style={CATEGORY_STYLE[tip.category]}
        >
          {CATEGORY_LABEL[tip.category]}
        </span>
        <p className="text-[13px] text-gray-600 leading-relaxed">{tip.text}</p>
      </div>
      <div className="sr-only" aria-live="polite">{tip.text}</div>
    </div>
  );
}
