// Thin wrapper over Google's OAuth token endpoint + the Gmail REST API.
// No googleapis dependency -- these are plain fetch calls, which is all
// Gmail's API needs.

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/gmail.send"].join(" ");

function getRedirectUri(): string {
  return `${process.env.NEXT_PUBLIC_SITE_URL}/api/integrations/gmail/callback`;
}

// access_type=offline + prompt=consent guarantees a refresh_token comes back
// -- Google only issues one on the *first* consent otherwise, which would
// silently break reconnecting an account that revoked access once before.
export function getGmailAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Google token exchange failed: ${await res.text()}`);
  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Google token refresh failed: ${await res.text()}`);
  const data: TokenResponse = await res.json();
  return { accessToken: data.access_token, expiresIn: data.expires_in };
}

export async function getGmailProfile(accessToken: string): Promise<{ emailAddress: string }> {
  const res = await fetch(`${GMAIL_API_BASE}/profile`, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Could not read Gmail profile: ${await res.text()}`);
  return res.json();
}

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  messageIdHeader: string | null;
  from: string;
  fromName: string | null;
  subject: string | null;
  snippet: string;
  receivedAt: string;
}

function decodeHeader(headers: { name: string; value: string }[], name: string): string | null {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || null;
}

// "Jane Doe <jane@example.com>" -> { name: "Jane Doe", address: "jane@example.com" }
// falls back to treating the whole header as the address if it isn't in
// that bracketed form (some senders just send a bare address).
function parseFrom(fromHeader: string | null): { address: string; name: string | null } {
  if (!fromHeader) return { address: "unknown", name: null };
  const match = fromHeader.match(/^(.*?)\s*<(.+?)>$/);
  if (match) return { name: match[1].replace(/"/g, "").trim() || null, address: match[2].trim() };
  return { address: fromHeader.trim(), name: null };
}

// Only lists message IDs newer than the given cutoff (or the last 14 days on
// a first sync) -- classification runs per-message, so keeping this narrow
// keeps both the Gmail call and the Claude call cheap on every dashboard load.
export async function listRecentMessageIds(accessToken: string, afterEpochSeconds?: number): Promise<string[]> {
  const query = afterEpochSeconds ? `in:inbox after:${afterEpochSeconds}` : "in:inbox newer_than:14d";
  const params = new URLSearchParams({ q: query, maxResults: "25" });
  const res = await fetch(`${GMAIL_API_BASE}/messages?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Gmail list failed: ${await res.text()}`);
  const data = await res.json();
  return (data.messages || []).map((m: { id: string }) => m.id);
}

export async function getMessageSummary(accessToken: string, messageId: string): Promise<GmailMessageSummary> {
  const params = new URLSearchParams({ format: "metadata" });
  for (const header of ["Subject", "From", "Date", "Message-Id"]) params.append("metadataHeaders", header);
  const res = await fetch(`${GMAIL_API_BASE}/messages/${messageId}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Gmail get message failed: ${await res.text()}`);
  const data = await res.json();
  const headers: { name: string; value: string }[] = data.payload?.headers || [];
  const { address, name } = parseFrom(decodeHeader(headers, "From"));
  return {
    id: data.id,
    threadId: data.threadId,
    messageIdHeader: decodeHeader(headers, "Message-Id"),
    from: address,
    fromName: name,
    subject: decodeHeader(headers, "Subject"),
    snippet: data.snippet || "",
    receivedAt: new Date(Number(data.internalDate)).toISOString(),
  };
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str, "utf-8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function sendGmailReply(
  accessToken: string,
  params: {
    fromEmail: string;
    to: string;
    subject: string;
    bodyText: string;
    threadId: string;
    inReplyTo: string | null;
  }
): Promise<void> {
  const subject = params.subject.toLowerCase().startsWith("re:") ? params.subject : `Re: ${params.subject}`;
  const headerLines = [
    `From: ${params.fromEmail}`,
    `To: ${params.to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=UTF-8",
    "MIME-Version: 1.0",
  ];
  if (params.inReplyTo) {
    headerLines.push(`In-Reply-To: ${params.inReplyTo}`);
    headerLines.push(`References: ${params.inReplyTo}`);
  }
  const raw = base64UrlEncode(`${headerLines.join("\r\n")}\r\n\r\n${params.bodyText}`);

  const res = await fetch(`${GMAIL_API_BASE}/messages/send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw, threadId: params.threadId }),
  });
  if (!res.ok) throw new Error(`Gmail send failed: ${await res.text()}`);
}
