"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { RequestStatus } from "@/lib/database.types";
import { logAccess } from "@/lib/access-log";

export async function updateLetterContentAction(formData: FormData) {
  const letterId = String(formData.get("letter_id") || "");
  const requestId = String(formData.get("request_id") || "");
  const content = String(formData.get("content") || "");
  const sectionsRaw = formData.get("sections");

  const supabase = await createClient();
  const update: { content: string; sections?: Record<string, { label: string; content: string }> } = { content };
  if (sectionsRaw) {
    update.sections = JSON.parse(String(sectionsRaw));
  }
  await supabase.from("letters").update(update).eq("id", letterId);

  revalidatePath(`/dashboard/requests/${requestId}`);
}

export async function approveLetterAction(formData: FormData) {
  const letterId = String(formData.get("letter_id") || "");
  const requestId = String(formData.get("request_id") || "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase
    .from("letters")
    .update({ approved_at: new Date().toISOString(), approved_by: user?.id })
    .eq("id", letterId);

  await supabase
    .from("pa_requests")
    .update({ status: "reviewed", updated_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("status", "draft");

  await logAccess({ userId: user?.id || null, action: "approve", resourceType: "letter", resourceId: letterId });

  revalidatePath(`/dashboard/requests/${requestId}`);
}

export async function updateStatusAction(formData: FormData) {
  const requestId = String(formData.get("request_id") || "");
  const status = String(formData.get("status") || "") as RequestStatus;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase
    .from("pa_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", requestId);

  await logAccess({ userId: user?.id || null, action: "status_change", resourceType: "pa_request", resourceId: requestId });

  if (status === "approved" || status === "denied") {
    const { notifyRequestStatusChange } = await import("../new/notify");
    await notifyRequestStatusChange(requestId, status);
  }

  revalidatePath(`/dashboard/requests/${requestId}`);
  revalidatePath("/dashboard");
}

export async function deleteRequestAction(formData: FormData) {
  const requestId = String(formData.get("request_id") || "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await logAccess({ userId: user?.id || null, action: "delete", resourceType: "pa_request", resourceId: requestId });

  // Letters cascade-delete via the pa_request_id foreign key.
  await supabase.from("pa_requests").delete().eq("id", requestId);

  revalidatePath("/dashboard");
}

export async function redraftAction(formData: FormData) {
  const requestId = String(formData.get("request_id") || "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await logAccess({ userId: user?.id || null, action: "redraft", resourceType: "pa_request", resourceId: requestId });

  const { draftLetterForRequest } = await import("../new/actions");
  try {
    await draftLetterForRequest(requestId);
  } catch (err) {
    console.error("redraftAction: draftLetterForRequest failed", err);
    redirect(
      `/dashboard/requests/${requestId}?error=${encodeURIComponent(
        `Re-drafting failed: ${err instanceof Error ? err.message : "unknown error"}. You can try again.`
      )}`
    );
  }
  redirect(`/dashboard/requests/${requestId}`);
}
