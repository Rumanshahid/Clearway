"use client";

import { useState } from "react";

export default function ShareButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}${path}`;
    if (navigator.share) {
      try {
        await navigator.share({ url });
        return;
      } catch {
        // User cancelled the native share sheet, or it failed -- fall
        // through to copy-to-clipboard rather than leaving them stuck.
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
    >
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <path d="M11 5.5a2 2 0 100-4 2 2 0 000 4zM5 10a2 2 0 100-4 2 2 0 000 4zM11 14.5a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="1.3" />
        <path d="M6.7 8.9l2.6 2.4M9.3 4.7L6.7 7.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
      {copied ? "Copied!" : "Share"}
    </button>
  );
}
