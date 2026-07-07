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

// Full date + time, shown only on hover (see the per-message timestamp span
// below) — by default no timestamp is visible at all, keeping the thread
// minimal.
function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} · ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
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
  // Rests as a narrow avatar-only rail; hovering it expands to full width as
  // an overlay (doesn't push the message thread), collapsing back the
  // moment the mouse leaves — same hover-reveal pattern as the nav bells.
  const [collapsed, setCollapsed] = useState(true);
  const [pendingAttachment, setPendingAttachment] = useState<{ file: File; type: "image" | "audio" | "file"; previewUrl: string } | null>(null);
  const [lightbox, setLightbox] = useState<{ url: string; name: string } | null>(null);

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

  // Attachments are staged in pendingAttachment rather than uploaded
  // immediately — attaching a file or recording a voice message just fills
  // the compose box's preview, so the sender can still remove it, add text
  // alongside it, or send, all in one message row (content + attachment
  // together).
  function stageAttachment(file: File, type: "image" | "audio" | "file", previewUrl: string) {
    if (pendingAttachment?.previewUrl) URL.revokeObjectURL(pendingAttachment.previewUrl);
    setPendingAttachment({ file, type, previewUrl });
  }

  function clearPendingAttachment() {
    if (pendingAttachment?.previewUrl) URL.revokeObjectURL(pendingAttachment.previewUrl);
    setPendingAttachment(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      alert("File is too large (max 15MB).");
      return;
    }
    const type = file.type.startsWith("image/") ? "image" : "file";
    stageAttachment(file, type, type === "image" ? URL.createObjectURL(file) : "");
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
        const file = new File([blob], `voice-message-${Date.now()}.webm`, { type: "audio/webm" });
        stageAttachment(file, "audio", URL.createObjectURL(blob));
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      alert("Couldn't access your microphone — check your browser's permission settings.");
    }
  }

  async function sendMessage() {
    if (!activeId || (!text.trim() && !pendingAttachment)) return;
    const content = text.trim() || null;
    const attachment = pendingAttachment;
    setText("");
    clearPendingAttachment();

    if (!attachment) {
      await supabase.from("messages").insert({ conversation_id: activeId, sender_id: currentUserId, content });
      return;
    }

    setUploading(true);
    try {
      const path = `${practiceId}/${activeId}/${crypto.randomUUID()}-${attachment.file.name}`;
      const { error: uploadError } = await supabase.storage.from("chat-attachments").upload(path, attachment.file);
      if (uploadError) {
        alert(`Upload failed: ${uploadError.message}`);
        return;
      }
      await supabase.from("messages").insert({
        conversation_id: activeId,
        sender_id: currentUserId,
        content,
        attachment_url: path,
        attachment_type: attachment.type,
        attachment_name: attachment.file.name,
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleDownloadAttachment(url: string, name: string) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank");
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
    <div className="h-full bg-white overflow-hidden flex items-stretch">
      <div className="relative flex-shrink-0" style={{ width: 64 }}>
        <aside
          className={`absolute inset-y-0 left-0 ${collapsed ? "w-16" : "w-[260px]"} overflow-hidden flex flex-col bg-white transition-all duration-200 z-30`}
          style={{
            borderRight: "1px solid var(--gray-200)",
            boxShadow: collapsed ? "none" : "8px 0 24px rgba(0,0,0,0.08)",
          }}
          onMouseEnter={() => setCollapsed(false)}
          onMouseLeave={() => setCollapsed(true)}
        >
        <div className="p-3 flex items-center" style={{ borderBottom: "1px solid var(--gray-200)" }}>
          {!collapsed && <span className="text-[13px] font-semibold">Conversations</span>}
        </div>

        <div className="p-2" style={{ borderBottom: "1px solid var(--gray-200)" }}>
          {collapsed ? (
            <button
              type="button"
              className="w-full h-8 rounded-md flex items-center justify-center hover:bg-gray-100"
              aria-label="New group"
              title="New group"
              onClick={() => setShowNew((v) => !v)}
            >
              +
            </button>
          ) : (
            <button
              type="button"
              className="w-full h-8 rounded-md flex items-center justify-center gap-1.5 text-[13px] font-medium text-gray-700 hover:bg-gray-100"
              onClick={() => setShowNew((v) => !v)}
            >
              + New group
            </button>
          )}
        </div>

        {showNew && !collapsed && (
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
          {conversations.length === 0 && !showNew && !collapsed && (
            <p className="text-[12.5px] text-gray-400 p-4">No conversations yet — start one above.</p>
          )}
          {conversations.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`w-full flex items-center text-left text-[13.5px] transition-colors ${collapsed ? "justify-center px-2 py-3" : "gap-2 px-4 py-3"} ${c.id === activeId ? "" : "hover:bg-gray-50"}`}
              style={{
                borderBottom: "1px solid var(--gray-100)",
                ...(c.id === activeId ? { background: "var(--gray-50)" } : {}),
              }}
              title={collapsed ? c.label : undefined}
              onClick={() => setActiveId(c.id)}
            >
              {c.type === "group" || c.type === "team" ? (
                <span className="text-gray-400">👥</span>
              ) : (
                c.otherId && <Avatar name={nameById.get(c.otherId)} userId={c.otherId} avatarUrl={avatarById.get(c.otherId)} size={22} />
              )}
              {!collapsed && c.label}
            </button>
          ))}
        </div>
        </aside>
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
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
                const showIdentity = !mine && (activeConversation.type === "group" || activeConversation.type === "team");
                return (
                  <div key={m.id} className={`group flex flex-col gap-1 ${mine ? "items-end" : "items-start"}`}>
                    {showIdentity && (
                      <span title={nameById.get(m.sender_id) || "Unknown"}>
                        <Avatar name={nameById.get(m.sender_id)} userId={m.sender_id} avatarUrl={avatarById.get(m.sender_id)} size={20} />
                      </span>
                    )}
                    {m.content && (
                      <div
                        className="rounded-2xl px-3 py-2 max-w-[70%] text-[13.5px]"
                        style={mine ? { background: "var(--indigo-600)", color: "#fff" } : { background: "var(--gray-100)", color: "var(--gray-900)" }}
                      >
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      </div>
                    )}
                    {m.attachment_url && m.attachment_type === "image" && signedUrls[m.attachment_url] && (
                      <button
                        type="button"
                        className="p-0 border-0 bg-transparent cursor-pointer"
                        onClick={() => setLightbox({ url: signedUrls[m.attachment_url!], name: m.attachment_name || "Photo" })}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={signedUrls[m.attachment_url]}
                          alt={m.attachment_name || "Photo"}
                          className="rounded-lg max-w-[220px]"
                        />
                      </button>
                    )}
                    {m.attachment_url && m.attachment_type === "audio" && signedUrls[m.attachment_url] && (
                      <audio controls src={signedUrls[m.attachment_url]} style={{ maxWidth: "220px" }} />
                    )}
                    {m.attachment_url && m.attachment_type === "file" && signedUrls[m.attachment_url] && (
                      <a
                        href={signedUrls[m.attachment_url]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-[13px] rounded-lg px-3 py-2"
                        style={{ background: mine ? "#EEF0FF" : "var(--gray-100)", color: "var(--indigo-600)" }}
                      >
                        📎 {m.attachment_name || "File"}
                      </a>
                    )}
                    <span className="flex items-center gap-1 text-[10.5px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatDateTime(m.created_at)}
                      {status && (
                        <>
                          <span>·</span>
                          <span style={{ color: status === "seen" ? "var(--indigo-600)" : "var(--gray-400)" }}>
                            {status === "sent" ? "Sent" : status === "delivered" ? "Delivered" : "Read"}
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <div style={{ borderTop: "1px solid var(--gray-200)" }}>
              {pendingAttachment && (
                <div className="px-3 pt-3 flex items-center">
                  <div className="flex items-center gap-2 rounded-lg px-2 py-1.5" style={{ background: "var(--gray-100)" }}>
                    {pendingAttachment.type === "image" && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={pendingAttachment.previewUrl} alt="Attachment preview" className="w-10 h-10 rounded object-cover" />
                    )}
                    {pendingAttachment.type === "audio" && (
                      <audio controls src={pendingAttachment.previewUrl} style={{ maxWidth: 200 }} />
                    )}
                    {pendingAttachment.type === "file" && (
                      <span className="text-[13px] text-gray-700">📎 {pendingAttachment.file.name}</span>
                    )}
                    <button
                      type="button"
                      className="text-gray-400 hover:text-[var(--danger-red)]"
                      aria-label="Remove attachment"
                      title="Remove attachment"
                      onClick={clearPendingAttachment}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
              <div className="p-3 flex items-center gap-2">
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
                    if (e.key === "Enter") sendMessage();
                  }}
                />
                <button
                  type="button"
                  className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 hover:bg-gray-100 disabled:opacity-50"
                  disabled={uploading}
                  onClick={sendMessage}
                  aria-label="Send message"
                  title="Send"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M14 2L2 7.5l4.5 1.8L8.5 14 14 2z" stroke="var(--indigo-600)" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" />
                    <path d="M14 2L6.5 9.3" stroke="var(--indigo-600)" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-[13.5px]">
            Select or start a conversation to begin.
          </div>
        )}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setLightbox(null)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ background: "#fff" }}
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadAttachment(lightbox.url, lightbox.name);
              }}
            >
              Download
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ background: "#fff" }}
              aria-label="Close"
              onClick={(e) => {
                e.stopPropagation();
                setLightbox(null);
              }}
            >
              ✕
            </button>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox.url}
            alt={lightbox.name}
            className="max-w-[90vw] max-h-[85vh] rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
