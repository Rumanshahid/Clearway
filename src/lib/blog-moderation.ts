import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/server";
import { notify } from "@/lib/notifications";

let client: Anthropic | null = null;

function getClient() {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

// Posts and comments are published immediately, never held for review --
// this only classifies content after the fact so the super_admin can be
// notified and go delete it if it's actually a problem. A classifier
// failure (no API key, network error, bad JSON) must never block or delay
// the publish, so every failure mode here just resolves to "not flagged".
export async function checkAlarmingContent(text: string): Promise<{ flagged: boolean; reason: string | null }> {
  if (!process.env.ANTHROPIC_API_KEY || !text.trim()) return { flagged: false, reason: null };

  try {
    const response = await getClient().messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
      max_tokens: 300,
      system:
        'You review user-submitted health-related blog posts and comments for content that needs urgent human review: threats of self-harm or harm to others, a medical emergency described as happening right now, illegal activity, or harassment/hate speech. Respond ONLY with JSON: {"flagged": boolean, "reason": string}. "reason" is empty if not flagged, otherwise one sentence for the reviewer.',
      messages: [{ role: "user", content: text.slice(0, 6000) }],
    });

    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") return { flagged: false, reason: null };

    const parsed = JSON.parse(block.text.replace(/```json|```/g, "").trim());
    return { flagged: !!parsed.flagged, reason: parsed.reason || null };
  } catch (err) {
    console.error("checkAlarmingContent failed", err);
    return { flagged: false, reason: null };
  }
}

export async function notifySuperAdminsOfFlag(params: { message: string; link: string }) {
  const admin = await createAdminClient();
  const { data: superAdmins } = await admin.from("profiles").select("id").eq("role", "super_admin");

  await Promise.all(
    (superAdmins || []).map((row) =>
      notify({ userId: row.id, type: "blog_flag", message: params.message, link: params.link })
    )
  );
}
