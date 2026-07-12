"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionProfile } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { WIDGET_REGISTRY, type DashboardLayout } from "@/lib/dashboardWidgets";
import { ensureValidAccessToken } from "@/lib/gmailSync";
import { sendGmailReply } from "@/lib/gmail";

const VALID_KEYS = new Set(WIDGET_REGISTRY.map((w) => w.key));

export async function updateDashboardLayoutAction(formData: FormData) {
  const session = await getSessionProfile();
  const supabase = await createClient();

  let parsed: Partial<DashboardLayout> = {};
  try {
    parsed = JSON.parse(String(formData.get("layout") || "{}"));
  } catch {
    redirect(`/dashboard/overview?error=${encodeURIComponent("Could not save layout.")}`);
  }

  const layout: DashboardLayout = {
    order: Array.isArray(parsed.order) ? parsed.order.filter((k): k is string => typeof k === "string" && VALID_KEYS.has(k)) : [],
    hidden: Array.isArray(parsed.hidden) ? parsed.hidden.filter((k): k is string => typeof k === "string" && VALID_KEYS.has(k)) : [],
  };

  const { error } = await supabase.from("profiles").update({ dashboard_layout: layout }).eq("id", session.userId);

  // Forces a fresh render of the page (and every nested Client Component,
  // resetting the Customize modal's local state) instead of risking a
  // cached RSC payload getting served for a redirect target the router
  // has already visited -- e.g. two failed saves in a row would otherwise
  // land on the exact same URL.
  revalidatePath("/dashboard/overview");

  if (error) {
    redirect(`/dashboard/overview?error=${encodeURIComponent(`Could not save layout: ${error.message}`)}`);
  }

  redirect("/dashboard/overview?saved=1");
}

export async function replyToInboxMessageAction(formData: FormData) {
  const session = await getSessionProfile();
  const supabase = await createClient();

  const inboxMessageId = String(formData.get("inbox_message_id") || "");
  const body = String(formData.get("body") || "").trim();
  if (!inboxMessageId || !body) {
    redirect(`/dashboard/overview?error=${encodeURIComponent("A reply can't be empty.")}`);
  }

  // Ownership is resolved server-side from the signed-in session, not
  // trusted from the form -- a doctor can only ever reply through their own
  // connected inbox, never a colleague's.
  const { data: doctorProfile } = await supabase.from("doctor_profiles").select("id").eq("profile_id", session.userId).maybeSingle();
  if (!doctorProfile) {
    redirect(`/dashboard/overview?error=${encodeURIComponent("No inbox connected.")}`);
  }

  const { data: message } = await supabase
    .from("inbox_messages")
    .select("*")
    .eq("id", inboxMessageId)
    .eq("doctor_profile_id", doctorProfile!.id)
    .maybeSingle();
  if (!message) {
    redirect(`/dashboard/overview?error=${encodeURIComponent("That email could not be found.")}`);
  }

  const { data: connection } = await supabase.from("email_connections").select("*").eq("doctor_profile_id", doctorProfile!.id).maybeSingle();
  if (!connection) {
    redirect(`/dashboard/overview?error=${encodeURIComponent("Gmail is not connected.")}`);
  }

  try {
    const accessToken = await ensureValidAccessToken(supabase, connection!);
    await sendGmailReply(accessToken, {
      fromEmail: connection!.email_address,
      to: message!.from_address,
      subject: message!.subject || "(no subject)",
      bodyText: body,
      threadId: message!.gmail_thread_id,
      inReplyTo: message!.message_id_header,
    });
  } catch (err) {
    console.error("Gmail reply failed", err);
    redirect(`/dashboard/overview?error=${encodeURIComponent("Could not send the reply — try reconnecting Gmail from your Profile page.")}`);
  }

  await supabase.from("inbox_messages").update({ replied: true }).eq("id", inboxMessageId);

  revalidatePath("/dashboard/overview");
  redirect("/dashboard/overview?replied=1");
}
