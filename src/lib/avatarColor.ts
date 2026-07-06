// Deterministic per-user color instead of Math.random() — same input always
// produces the same output, so server-rendered and client-hydrated markup
// never disagree (the exact hydration-mismatch class of bug fixed elsewhere
// in this app for TipsRotator and the notification timestamp).
const PALETTE = [
  "#6366F1", "#EC4899", "#F59E0B", "#10B981", "#3B82F6",
  "#8B5CF6", "#EF4444", "#14B8A6", "#F97316", "#0EA5E9",
  "#A855F7", "#22C55E",
];

export function avatarColorFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function initialFor(name: string | null | undefined): string {
  const trimmed = (name || "").trim();
  return trimmed ? trimmed[0].toUpperCase() : "?";
}
