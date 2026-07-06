"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Avatar from "@/components/Avatar";

interface Member {
  id: string;
  name: string;
  title: string | null;
  avatarUrl: string | null;
}

interface ConversationSummary {
  id: string;
  type: string;
  label: string;
  otherId: string | null;
  createdBy: string;
  memberIds: string[];
  lastMessage: string | null;
}

interface Message {
  id: string;
  sender_id: string;
  content: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  attachment_name: string | null;
  created_at: string;
}

interface ReadReceipt {
  user_id: string;
  last_read_at: string;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function ChatClient({
  currentUserId,
  currentUserAvatarUrl,
  practiceId,
  members,
  initialConversations,
  initialActiveId,
}: {
  currentUserId: string;
  currentUserAvatarUrl: string | null;
  practiceId: string;
  members: Member[];
  initialConversations: ConversationSummary[];
  initialActiveId?: string;
}) {
  const supabase = createClient();
  const [conversations, setConversations] = useState(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(initialActiveId || initialConversations[0]?.id || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reads, setReads] = useState<ReadReceipt[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [text, setText] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nameById = new Map(members.map((m) => [m.id, m.name]));
  nameById.set(currentUserId, "You");

  const avatarById = new Map(members.map((m) => [m.id, m.avatarUrl]));
  avatarById.set(currentUserId, currentUserAvatarUrl);

  async function resolveSignedUrl(path: string) {
    if (signedUrls[path]) return;
    const { data } = await supabase.storage.from("chat-attachments").createSignedUrl(path, 3600);
    if (data?.signedUrl) setSignedUrls((prev) => ({ ...prev, [path]: data.signedUrl }));
  }

  async function loadMessages(conversationId: string) {
    const { data } = await supabase
      .from("messages")
      .select("id, sender_id, content, attachment_url, attachment_type, attachment_name, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    setMessages(data || []);
    for (const m of data || []) {
      if (m.attachment_url) resolveSignedUrl(m.attachment_url);
    }
  }

  async function loadReads(conversationId: string) {
    const { data } = await supabase.from("conversation_reads").select("user_id, last_read_at").eq("conversation_id", conversationId);
    setReads(data || []);
  }

  async function markRead(conversationId: string) {
    await supabase.from("conversation_reads").upsert({ conversation_id: conversationId, user_id: currentUserId, last_read_at: new Date().toISOString() });
  }

  useEffect(() => {
    if (!activeId) return;
    // Fetching the newly-selected conversation's messages/reads, and
    // recording that we've now read it, is exactly what this effect is
    // for — every setState here happens asynchronously after a network
    // round trip, not synchronously in the effect body.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMessages(activeId);
    loadReads(activeId);
    markRead(activeId);

    const messagesChannel = supabase
      .channel(`messages-${activeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeId}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.some((existing) => existing.id === m.id) ? prev : [...prev, m]));
          if (m.attachment_url) resolveSignedUrl(m.attachment_url);
          if (m.sender_id !== currentUserId) markRead(activeId);
        }
      )
      .subscribe();

    const readsChannel = supabase
      .channel(`reads-${activeId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversation_reads", filter: `conversation_id=eq.${activeId}` },
        (payload) => {
          if (payload.eventType === "DELETE") return;
          const r = payload.new as ReadReceipt;
          setReads((prev) => [...prev.filter((x) => x.user_id !== r.user_id), r]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(readsChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // Practice-wide presence — tracks who currently has the Chat page open at
  // all (any conversation), not just the active one. This is what "delivered"
  // means here: their client is connected and would receive the message via
  // realtime, whether or not they've opened this specific conversation yet.
  // Subscribed once on mount, independent of which conversation is active.
  useEffect(() => {
    const presenceChannel = supabase.channel(`practice-presence-${practiceId}`, {
      config: { presence: { key: currentUserId } },
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        setOnlineUserIds(new Set(Object.keys(presenceChannel.presenceState())));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleCreateGroup() {
    if (!groupName.trim() || selectedMemberIds.length === 0) return;
    const { data: newConvo, error } = await supabase
      .from("conversations")
      .insert({ practice_id: practiceId, type: "group", name: groupName.trim(), created_by: currentUserId })
      .select("id")
      .single();
    if (error || !newConvo) return;

    await supabase.from("conversation_members").insert([
      { conversation_id: newConvo.id, user_id: currentUserId },
      ...selectedMemberIds.map((id) => ({ conversation_id: newConvo.id, user_id: id })),
    ]);

    setConversations((prev) => [
      {
        id: newConvo.id,
        type: "group",
        label: groupName.trim(),
        otherId: null,
        createdBy: currentUserId,
        memberIds: [currentUserId, ...selectedMemberIds],
        lastMessage: null,
      },
      ...prev,
    ]);
    setActiveId(newConvo.id);
    setShowNew(false);
    setGroupName("");
    setSelectedMemberIds([]);
  }

  async function handleDeleteGroup() {
    if (!activeId) return;
    if (!confirm("Delete this group for everyone? This can't be undone.")) return;
    const { error } = await supabase.from("conversations").delete().eq("id", activeId);
    if (error) {
      alert(`Couldn't delete the group: ${error.message}`);
      return;
    }
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== activeId);
      setActiveId(next[0]?.id || null);
      return next;
    });
  }

  async function handleSendText() {
    if (!text.trim() || !activeId) return;
    const content = text.trim();
    setText("");
    await supabase.from("messages").insert({ conversation_id: activeId, sender_id: currentUserId, content });
  }

  async function uploadAttachment(file: File, attachmentType: "image" | "audio" | "file") {
    if (!activeId) return;
    if (file.size > 15 * 1024 * 1024) {
      alert("File is too large (max 15MB).");
      return;
    }
    setUploading(true);
    try {
      const path = `${practiceId}/${activeId}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("chat-attachments").upload(path, file);
      if (uploadError) {
        alert(`Upload failed: ${uploadError.message}`);
        return;
      }
      await supabase.from("messages").insert({
        conversation_id: activeId,
        sender_id: currentUserId,
        attachment_url: path,
        attachment_type: attachmentType,
        attachment_name: file.name,
      });
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const type = file.type.startsWith("image/") ? "image" : "file";
    uploadAttachment(file, type);
    e.target.value = "";
  }

  async function toggleVoiceRecording() {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        uploadAttachment(new File([blob], `voice-message-${Date.now()}.webm`, { type: "audio/webm" }), "audio");
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      alert("Couldn't access your microphone — check your browser's permission settings.");
    }
  }

  const activeConversation = conversations.find((c) => c.id === activeId);
  const otherMemberIds = activeConversation ? activeConversation.memberIds.filter((id) => id !== currentUserId) : [];

  function isSeenByAll(messageCreatedAt: string): boolean {
    if (otherMemberIds.length === 0) return false;
    return otherMemberIds.every((id) => {
      const r = reads.find((x) => x.user_id === id);
      return !!r && new Date(r.last_read_at) >= new Date(messageCreatedAt);
    });
  }

  // Sent: nobody else has this page open right now. Delivered: they do
  // (their client would receive it via realtime), but haven't opened this
  // conversation yet. Seen: they've actually opened it since this was sent.
  function messageStatus(messageCreatedAt: string): "sent" | "delivered" | "seen" {
    if (isSeenByAll(messageCreatedAt)) return "seen";
    if (otherMemberIds.length > 0 && otherMemberIds.every((id) => onlineUserIds.has(id))) return "delivered";
    return "sent";
  }

  return (
    <div className="flex gap-6 items-start" style={{ height: "70vh" }}>
      <aside className="w-[260px] flex-shrink-0 card p-0 overflow-hidden flex flex-col h-full">
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--gray-200)" }}>
          <span className="text-[13px] font-semibold">Conversations</span>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowNew((v) => !v)}>
            + New group
          </button>
        </div>

        {showNew && (
          <div className="p-4 flex flex-col gap-3" style={{ borderBottom: "1px solid var(--gray-200)" }}>
            <input className="input" placeholder="Group name" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
            <div className="flex flex-col gap-1 max-h-[140px] overflow-y-auto">
              {members.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-[13px] px-2 py-1">
                  <input
                    type="checkbox"
                    checked={selectedMemberIds.includes(m.id)}
                    onChange={(e) =>
                      setSelectedMemberIds((prev) => (e.target.checked ? [...prev, m.id] : prev.filter((id) => id !== m.id)))
                    }
                  />
                  <Avatar name={m.name} userId={m.id} avatarUrl={m.avatarUrl} size={22} />
                  {m.name}
                </label>
              ))}
            </div>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleCreateGroup}>
              Create group
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && !showNew && (
            <p className="text-[12.5px] text-gray-400 p-4">No conversations yet — start one above.</p>
          )}
          {conversations.map((c) => (
            <button
              key={c.id}
              type="button"
              className="w-full flex items-center gap-2 text-left px-4 py-3 text-[13.5px]"
              style={{
                background: c.id === activeId ? "var(--gray-50)" : "transparent",
                borderBottom: "1px solid var(--gray-100)",
              }}
              onClick={() => setActiveId(c.id)}
            >
              {c.type === "group" || c.type === "team" ? (
                <span className="text-gray-400">👥</span>
              ) : (
                c.otherId && <Avatar name={nameById.get(c.otherId)} userId={c.otherId} avatarUrl={avatarById.get(c.otherId)} size={22} />
              )}
              {c.label}
            </button>
          ))}
        </div>
      </aside>

      <div className="flex-1 min-w-0 h-full card p-0 flex flex-col">
        {activeConversation ? (
          <>
            <div className="p-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--gray-200)" }}>
              <span className="font-semibold text-[14px]">
                {(activeConversation.type === "group" || activeConversation.type === "team") && "👥 "}
                {activeConversation.label}
              </span>
              {activeConversation.type === "group" && activeConversation.createdBy === currentUserId && (
                <button
                  type="button"
                  className="text-btn text-gray-400 hover:text-[var(--danger-red)]"
                  aria-label="Delete group"
                  title="Delete group"
                  onClick={handleDeleteGroup}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 4.5h10M6.5 4.5V3a1 1 0 011-1h1a1 1 0 011 1v1.5M4.5 4.5V13a1 1 0 001 1h5a1 1 0 001-1V4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {messages.map((m) => {
                const mine = m.sender_id === currentUserId;
                const status = mine ? messageStatus(m.created_at) : null;
                return (
                  <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                    <span className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-0.5">
                      {!mine && <Avatar name={nameById.get(m.sender_id)} userId={m.sender_id} avatarUrl={avatarById.get(m.sender_id)} size={16} />}
                      {nameById.get(m.sender_id) || "Unknown"}
                    </span>
                    <div
                      className="rounded-2xl px-3 py-2 max-w-[70%] text-[13.5px]"
                      style={mine ? { background: "var(--indigo-600)", color: "#fff" } : { background: "var(--gray-100)", color: "var(--gray-900)" }}
                    >
                      {m.content && <p className="whitespace-pre-wrap">{m.content}</p>}
                      {m.attachment_url && m.attachment_type === "image" && signedUrls[m.attachment_url] && (
                        <a href={signedUrls[m.attachment_url]} target="_blank" rel="noopener noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={signedUrls[m.attachment_url]} alt={m.attachment_name || "Photo"} className="rounded-lg mt-1 max-w-[220px]" />
                        </a>
                      )}
                      {m.attachment_url && m.attachment_type === "audio" && signedUrls[m.attachment_url] && (
                        <audio controls src={signedUrls[m.attachment_url]} className="mt-1" style={{ maxWidth: "220px" }} />
                      )}
                      {m.attachment_url && m.attachment_type === "file" && signedUrls[m.attachment_url] && (
                        <a href={signedUrls[m.attachment_url]} target="_blank" rel="noopener noreferrer" className="underline text-[13px] mt-1 inline-block">
                          📎 {m.attachment_name || "File"}
                        </a>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-[10.5px] text-gray-400 mt-0.5">
                      {formatTime(m.created_at)}
                      {status && (
                        <span style={{ color: status === "seen" ? "var(--indigo-600)" : "var(--gray-400)" }}>
                          {status === "sent" ? "✓" : "✓✓"}
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-3 flex items-center gap-2" style={{ borderTop: "1px solid var(--gray-200)" }}>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
              <button type="button" className="btn btn-outline btn-sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                📎
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={recording ? { background: "var(--danger-bg)", color: "var(--danger-red)" } : undefined}
                onClick={toggleVoiceRecording}
              >
                {recording ? "■ Stop" : "🎤"}
              </button>
              <input
                className="input flex-1"
                placeholder="Type a message…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendText();
                }}
              />
              <button type="button" className="btn btn-primary btn-sm" onClick={handleSendText}>
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-[13.5px]">
            Select or start a conversation to begin.
          </div>
        )}
      </div>
    </div>
  );
}
