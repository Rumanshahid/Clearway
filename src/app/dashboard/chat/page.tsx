import { getSessionProfile } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import ChatClient from "./ChatClient";

export default async function ChatPage() {
  const session = await getSessionProfile();
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name, title, role, avatar_url")
    .eq("practice_id", session.practiceId)
    .neq("id", session.userId)
    .order("full_name");

  const { data: ownProfile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", session.userId)
    .single();

  // Conversations this user belongs to, newest activity first isn't tracked
  // separately — ordering by the conversation's own created_at is close
  // enough for a practice-sized team without a denormalized last-message column.
  const { data: memberRows } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("user_id", session.userId);

  const conversationIds = (memberRows || []).map((r) => r.conversation_id);

  const { data: conversations } = conversationIds.length
    ? await supabase
        .from("conversations")
        .select("id, type, name, created_at")
        .in("id", conversationIds)
        .order("created_at", { ascending: false })
    : { data: [] as { id: string; type: string; name: string | null; created_at: string }[] };

  const { data: allMembers } = conversationIds.length
    ? await supabase
        .from("conversation_members")
        .select("conversation_id, user_id")
        .in("conversation_id", conversationIds)
    : { data: [] as { conversation_id: string; user_id: string }[] };

  const nameById = new Map((members || []).map((m) => [m.id, m.full_name || "Unnamed"]));
  nameById.set(session.userId, "You");

  const conversationsWithLabel = (conversations || []).map((c) => {
    const memberIds = (allMembers || []).filter((m) => m.conversation_id === c.id).map((m) => m.user_id);
    const otherIds = memberIds.filter((id) => id !== session.userId);
    const label = c.type === "group" ? c.name || "Group" : otherIds.map((id) => nameById.get(id) || "Unknown").join(", ") || "You";
    const otherId = c.type === "dm" && otherIds.length === 1 ? otherIds[0] : null;
    return { id: c.id, type: c.type, label, otherId };
  });

  return (
    <div className="max-w-[1300px] mx-auto py-8 px-5">
      <h1 className="text-[24px] font-semibold mb-1">Chat</h1>
      <p className="text-[14px] text-gray-600 mb-6">Message anyone on your team directly, or start a group.</p>

      <ChatClient
        currentUserId={session.userId}
        currentUserAvatarUrl={ownProfile?.avatar_url || null}
        practiceId={session.practiceId}
        members={(members || []).map((m) => ({ id: m.id, name: m.full_name || "Unnamed", title: m.title, avatarUrl: m.avatar_url }))}
        initialConversations={conversationsWithLabel}
      />
    </div>
  );
}
