import { getSessionProfile } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { ensureTeamConversation, ensureDirectConversations, getConversationSummaries } from "@/lib/chat";
import ChatClient from "./ChatClient";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string }>;
}) {
  const { conversation } = await searchParams;
  const session = await getSessionProfile();
  const supabase = await createClient();

  const { data: allMembers } = await supabase
    .from("profiles")
    .select("id, full_name, title, role, avatar_url")
    .eq("practice_id", session.practiceId)
    .order("full_name");

  const { data: ownProfile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", session.userId)
    .single();

  const otherMembers = (allMembers || []).filter((m) => m.id !== session.userId);

  await ensureTeamConversation(session.practiceId, session.userId, (allMembers || []).map((m) => m.id));
  await ensureDirectConversations(session.practiceId, session.userId, otherMembers.map((m) => m.id));
  const conversationsWithLabel = await getConversationSummaries(session.userId, session.practiceId);

  return (
    <div className="max-w-[1300px] mx-auto py-8 px-5">
      <h1 className="text-[24px] font-semibold mb-1">Chat</h1>
      <p className="text-[14px] text-gray-600 mb-6">Everyone&apos;s in the Team conversation by default, plus a direct chat with each teammate — start a group for anything more specific.</p>

      <ChatClient
        currentUserId={session.userId}
        currentUserAvatarUrl={ownProfile?.avatar_url || null}
        practiceId={session.practiceId}
        members={otherMembers.map((m) => ({ id: m.id, name: m.full_name || "Unnamed", title: m.title, avatarUrl: m.avatar_url }))}
        initialConversations={conversationsWithLabel}
        initialActiveId={conversation && conversationsWithLabel.some((c) => c.id === conversation) ? conversation : undefined}
      />
    </div>
  );
}
