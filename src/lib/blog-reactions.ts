export const REACTION_TYPES = ["like", "support", "insightful", "love", "laugh", "angry", "sad"] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];

export const REACTION_META: Record<ReactionType, { emoji: string; label: string }> = {
  like: { emoji: "👍", label: "Like" },
  support: { emoji: "🤝", label: "Support" },
  insightful: { emoji: "💡", label: "Insightful" },
  love: { emoji: "❤️", label: "Love" },
  laugh: { emoji: "😂", label: "Laugh" },
  angry: { emoji: "😠", label: "Angry" },
  sad: { emoji: "😢", label: "Sad" },
};

export function emptyReactionCounts(): Record<ReactionType, number> {
  return { like: 0, support: 0, insightful: 0, love: 0, laugh: 0, angry: 0, sad: 0 };
}

export function isReactionType(value: string): value is ReactionType {
  return (REACTION_TYPES as readonly string[]).includes(value);
}
