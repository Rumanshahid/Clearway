import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { refreshAccessToken, listRecentMessageIds, getMessageSummary } from "@/lib/gmail";
import { classifyInboxMessages } from "@/lib/inbox-anthropic";

type Db = SupabaseClient<Database>;
type EmailConnectionRow = Database["public"]["Tables"]["email_connections"]["Row"];

// Refreshes ~2 minutes before actual expiry so a token that's valid when
// checked doesn't expire mid-request.
const EXPIRY_BUFFER_MS = 2 * 60 * 1000;

export async function ensureValidAccessToken(supabase: Db, connection: EmailConnectionRow): Promise<string> {
  const expiresAt = new Date(connection.token_expires_at).getTime();
  if (expiresAt - Date.now() > EXPIRY_BUFFER_MS) {
    return connection.access_token;
  }

  const { accessToken, expiresIn } = await refreshAccessToken(connection.refresh_token);
  const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
  await supabase.from("email_connections").update({ access_token: accessToken, token_expires_at: tokenExpiresAt }).eq("id", connection.id);
  return accessToken;
}

// Only fetches + classifies messages newer than the last sync (or the last
// 14 days on a first sync) -- repeat dashboard loads with nothing new skip
// both the Gmail and Claude calls entirely.
export async function syncInboxForDoctor(supabase: Db, connection: EmailConnectionRow): Promise<void> {
  const accessToken = await ensureValidAccessToken(supabase, connection);
  const afterEpochSeconds = connection.last_synced_at ? Math.floor(new Date(connection.last_synced_at).getTime() / 1000) : undefined;

  const ids = await listRecentMessageIds(accessToken, afterEpochSeconds);
  const now = new Date().toISOString();

  if (ids.length === 0) {
    await supabase.from("email_connections").update({ last_synced_at: now }).eq("id", connection.id);
    return;
  }

  const { data: existing } = await supabase
    .from("inbox_messages")
    .select("gmail_message_id")
    .eq("doctor_profile_id", connection.doctor_profile_id)
    .in("gmail_message_id", ids);
  const existingIds = new Set((existing || []).map((r) => r.gmail_message_id));
  const newIds = ids.filter((id) => !existingIds.has(id));

  if (newIds.length === 0) {
    await supabase.from("email_connections").update({ last_synced_at: now }).eq("id", connection.id);
    return;
  }

  const summaries = await Promise.all(newIds.map((id) => getMessageSummary(accessToken, id)));
  const classifications = await classifyInboxMessages(
    summaries.map((s) => ({ id: s.id, from: s.from, subject: s.subject, snippet: s.snippet }))
  );

  const rows = summaries.map((s) => {
    const classification = classifications.get(s.id) || { category: "other" as const, isRelevant: false };
    return {
      practice_id: connection.practice_id,
      doctor_profile_id: connection.doctor_profile_id,
      gmail_message_id: s.id,
      gmail_thread_id: s.threadId,
      message_id_header: s.messageIdHeader,
      from_address: s.from,
      from_name: s.fromName,
      subject: s.subject,
      snippet: s.snippet,
      received_at: s.receivedAt,
      category: classification.category,
      is_relevant: classification.isRelevant,
    };
  });

  await supabase.from("inbox_messages").upsert(rows, { onConflict: "doctor_profile_id,gmail_message_id" });
  await supabase.from("email_connections").update({ last_synced_at: now }).eq("id", connection.id);
}
