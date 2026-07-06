import { createClient } from "@/lib/supabase/server";

// Every practice gets one always-there "Team" conversation containing every
// current member — idempotent so it's safe to call on every page load: the
// first call creates it, every later call just adds whichever members
// aren't in it yet (new hires included).
export async function ensureTeamConversation(practiceId: string, currentUserId: string, memberIds: string[]) {
  const supabase = await createClient();

  const { data: existing, error: selectError } = await supabase
    .from("conversations")
    .select("id")
    .eq("practice_id", practiceId)
    .eq("type", "team")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (selectError) console.error("ensureTeamConversation: select existing failed", selectError);

  let teamId = existing?.id as string | undefined;

  if (!teamId) {
    const { data: created, error: insertError } = await supabase
      .from("conversations")
      .insert({ practice_id: practiceId, type: "team", name: "Team", created_by: currentUserId })
      .select("id")
      .single();
    if (insertError) {
      // Unique violation (23505) means another concurrent request (layout.tsx
      // and chat/page.tsx both call this in the same request) already
      // created it a moment earlier — the unique partial index on
      // (practice_id) where type='team' is what makes this race safe
      // instead of producing a duplicate. Just look up what won.
      if (insertError.code === "23505") {
        const { data: winner } = await supabase
          .from("conversations")
          .select("id")
          .eq("practice_id", practiceId)
          .eq("type", "team")
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        teamId = winner?.id;
      } else {
        console.error("ensureTeamConversation: insert conversation failed", insertError);
      }
    } else {
      teamId = created?.id;
    }
  }

  if (!teamId) return null;

  const { data: existingMembers, error: membersSelectError } = await supabase
    .from("conversation_members")
    .select("user_id")
    .eq("conversation_id", teamId);
  if (membersSelectError) console.error("ensureTeamConversation: select members failed", membersSelectError);

  const existingIds = new Set((existingMembers || []).map((m) => m.user_id));
  const missing = memberIds.filter((id) => !existingIds.has(id));
  if (missing.length > 0) {
    const { error: membersInsertError } = await supabase
      .from("conversation_members")
      .insert(missing.map((id) => ({ conversation_id: teamId, user_id: id })));
    if (membersInsertError) console.error("ensureTeamConversation: insert members failed", membersInsertError);
  }

  return teamId;
}

// Every user gets a 1:1 conversation with every other current teammate,
// auto-created the same way the Team conversation is — no "start a chat
// with this person" step needed. Only the lexicographically-smaller user id
// in a pair ever attempts to create it (arbitrary but stable ordering), so
// two people loading a page at the same moment can't both try to create the
// same pair — whichever id is "larger" just waits to see it show up once
// the other side's next page load creates it.
export async function ensureDirectConversations(practiceId: string, currentUserId: string, otherMemberIds: string[]) {
  const toCreate = otherMemberIds.filter((id) => currentUserId < id);
  if (toCreate.length === 0) return;

  const supabase = await createClient();

  const { data: myMemberRows } = await supabase.from("conversation_members").select("conversation_id").eq("user_id", currentUserId);
  const myConversationIds = (myMemberRows || []).map((r) => r.conversation_id);

  const { data: myDms } = myConversationIds.length
    ? await supabase.from("conversations").select("id").in("id", myConversationIds).eq("type", "dm")
    : { data: [] as { id: string }[] };
  const myDmIds = (myDms || []).map((c) => c.id);

  const { data: dmMembers } = myDmIds.length
    ? await supabase.from("conversation_members").select("conversation_id, user_id").in("conversation_id", myDmIds)
    : { data: [] as { conversation_id: string; user_id: string }[] };

  const existingPartners = new Set((dmMembers || []).filter((m) => m.user_id !== currentUserId).map((m) => m.user_id));

  for (const otherId of toCreate) {
    if (existingPartners.has(otherId)) continue;

    const { data: newConvo, error } = await supabase
      .from("conversations")
      .insert({ practice_id: practiceId, type: "dm", created_by: currentUserId })
      .select("id")
      .single();
    if (error || !newConvo) {
      console.error("ensureDirectConversations: create conversation failed", error);
      continue;
    }

    const { error: membersError } = await supabase.from("conversation_members").insert([
      { conversation_id: newConvo.id, user_id: currentUserId },
      { conversation_id: newConvo.id, user_id: otherId },
    ]);
    if (membersError) console.error("ensureDirectConversations: add members failed", membersError);
  }
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
