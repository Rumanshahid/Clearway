import { createClient } from "@/lib/supabase/server";

// Every practice gets one always-there "Team" conversation containing every
// current member — idempotent so it's safe to call on every page load: the
// first call creates it, every later call just adds whichever members
// aren't in it yet (new hires included).
export async function ensureTeamConversation(practiceId: string, currentUserId: string, memberIds: string[]) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("practice_id", practiceId)
    .eq("type", "team")
    .limit(1)
    .maybeSingle();

  let teamId = existing?.id as string | undefined;

  if (!teamId) {
    const { data: created } = await supabase
      .from("conversations")
      .insert({ practice_id: practiceId, type: "team", name: "Team", created_by: currentUserId })
      .select("id")
      .single();
    teamId = created?.id;
  }

  if (!teamId) return null;

  const { data: existingMembers } = await supabase
    .from("conversation_members")
    .select("user_id")
    .eq("conversation_id", teamId);

  const existingIds = new Set((existingMembers || []).map((m) => m.user_id));
  const missing = memberIds.filter((id) => !existingIds.has(id));
  if (missing.length > 0) {
    await supabase.from("conversation_members").insert(missing.map((id) => ({ conversation_id: teamId, user_id: id })));
  }

  return teamId;
}

export interface ConversationSummary {
  id: string;
  type: string;
  label: string;
  otherId: string | null;
}

// Conversations the given user belongs to, with a display label computed —
// "Team" for the default group, its name for a custom group, otherwise the
// other member's name (legacy 1:1s, if any still exist). Team is always
// sorted first.
export async function getConversationSummaries(userId: string, practiceId: string): Promise<ConversationSummary[]> {
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("practice_id", practiceId);

  const nameById = new Map((members || []).map((m) => [m.id, m.full_name || "Unnamed"]));
  nameById.set(userId, "You");

  const { data: memberRows } = await supabase.from("conversation_members").select("conversation_id").eq("user_id", userId);
  const conversationIds = (memberRows || []).map((r) => r.conversation_id);
  if (conversationIds.length === 0) return [];

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, type, name, created_at")
    .in("id", conversationIds)
    .order("created_at", { ascending: false });

  const { data: allMembers } = await supabase
    .from("conversation_members")
    .select("conversation_id, user_id")
    .in("conversation_id", conversationIds);

  const summaries = (conversations || []).map((c) => {
    const memberIds = (allMembers || []).filter((m) => m.conversation_id === c.id).map((m) => m.user_id);
    const otherIds = memberIds.filter((id) => id !== userId);
    const label =
      c.type === "team" ? c.name || "Team" : c.type === "group" ? c.name || "Group" : otherIds.map((id) => nameById.get(id) || "Unknown").join(", ") || "You";
    const otherId = c.type === "dm" && otherIds.length === 1 ? otherIds[0] : null;
    return { id: c.id, type: c.type, label, otherId };
  });

  summaries.sort((a, b) => (a.type === "team" ? -1 : b.type === "team" ? 1 : 0));
  return summaries;
}
