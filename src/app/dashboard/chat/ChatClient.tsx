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

export default function ChatClient({
  currentUserId,
  currentUserAvatarUrl,
  practiceId,
  members,
  initialConversations,
}: {
  currentUserId: string;
  currentUserAvatarUrl: string | null;
  practiceId: string;
  members: Member[];
  initialConversations: ConversationSummary[];
}) {
  const supabase = createClient();
  const [conversations, setConversations] = useState(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(initialConversations[0]?.id || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [text, setText] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [groupMode, setGroupMode] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);

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

  useEffect(() => {
    if (!activeId) return;
    // Fetching the newly-selected conversation's messages is exactly what
    // this effect is for — the resulting setState happens asynchronously
    // after the network round trip, not synchronously in the effect body.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMessages(activeId);

    const channel = supabase
      .channel(`messages-${activeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeId}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.some((existing) => existing.id === m.id) ? prev : [...prev, m]));
          if (m.attachment_url) resolveSignedUrl(m.attachment_url);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleStartDm(otherId: string) {
    // Reuse an existing 1:1 conversation with exactly this other person, if
    // one already exists, instead of creating duplicates every time.
    const { data: myConvos } = await supabase.from("conversation_members").select("conversation_id").eq("user_id", currentUserId);
    const { data: theirConvos } = await supabase.from("conversation_members").select("conversation_id").eq("user_id", otherId);
    const shared = (myConvos || []).map((c) => c.conversation_id).filter((id) => (theirConvos || []).some((t) => t.conversation_id === id));

    for (const id of shared) {
      const { data: convo } = await supabase.from("conversations").select("id, type").eq("id", id).single();
      if (convo?.type === "dm") {
        setActiveId(id);
        setShowNew(false);
        return;
      }
    }

    const { data: newConvo, error } = await supabase
      .from("conversations")
      .insert({ practice_id: practiceId, type: "dm", created_by: currentUserId })
      .select("id")
      .single();
    if (error || !newConvo) return;

    await supabase.from("conversation_members").insert([
      { conversation_id: newConvo.id, user_id: currentUserId },
      { conversation_id: newConvo.id, user_id: otherId },
    ]);

    setConversations((prev) => [{ id: newConvo.id, type: "dm", label: nameById.get(otherId) || "Unknown", otherId }, ...prev]);
    setActiveId(newConvo.id);
    setShowNew(false);
  }

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

    setConversations((prev) => [{ id: newConvo.id, type: "group", label: groupName.trim(), otherId: null }, ...prev]);
    setActiveId(newConvo.id);
    setShowNew(false);
    setGroupMode(false);
    setGroupName("");
    setSelectedMemberIds([]);
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

  return (
    <div className="flex gap-6 items-start" style={{ height: "70vh" }}>
      <aside className="w-[260px] flex-shrink-0 card p-0 overflow-hidden flex flex-col h-full">
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--gray-200)" }}>
          <span className="text-[13px] font-semibold">Conversations</span>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowNew((v) => !v)}>
            + New
          </button>
        </div>

        {showNew && (
          <div className="p-4 flex flex-col gap-3" style={{ borderBottom: "1px solid var(--gray-200)" }}>
            <div className="inline-flex rounded-[8px] border overflow-hidden text-[12px]" style={{ borderColor: "var(--gray-200)" }}>
              <button
                type="button"
                className="px-3 py-1.5 font-medium"
                style={!groupMode ? { background: "var(--indigo-600)", color: "#fff" } : { background: "#fff", color: "var(--gray-600)" }}
                onClick={() => setGroupMode(false)}
              >
                Direct message
              </button>
              <button
                type="button"
                className="px-3 py-1.5 font-medium"
                style={groupMode ? { background: "var(--indigo-600)", color: "#fff" } : { background: "#fff", color: "var(--gray-600)" }}
                onClick={() => setGroupMode(true)}
              >
                Group
              </button>
            </div>

            {!groupMode ? (
              <div className="flex flex-col gap-1 max-h-[160px] overflow-y-auto">
                {members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className="flex items-center gap-2 text-left text-[13px] px-2 py-1.5 rounded hover:bg-gray-50"
                    onClick={() => handleStartDm(m.id)}
                  >
                    <Avatar name={m.name} userId={m.id} avatarUrl={m.avatarUrl} size={24} />
                    <span>{m.name}{m.title ? <span className="text-gray-400"> — {m.title}</span> : null}</span>
                  </button>
                ))}
              </div>
            ) : (
              <>
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
              </>
            )}
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
              {c.type === "group" ? (
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
            <div className="p-4 font-semibold text-[14px]" style={{ borderBottom: "1px solid var(--gray-200)" }}>
              {activeConversation.type === "group" && "👥 "}
              {activeConversation.label}
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {messages.map((m) => {
                const mine = m.sender_id === currentUserId;
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
