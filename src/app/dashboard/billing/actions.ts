"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Paddle } from "@paddle/paddle-node-sdk";
import { createClient } from "@/lib/supabase/server";

export async function cancelSubscriptionAction(formData: FormData) {
  const practiceId = String(formData.get("practice_id") || "");
  const subscriptionId = String(formData.get("subscription_id") || "");
  const apiKey = process.env.PADDLE_API_KEY;

  if (!apiKey || !subscriptionId) {
    redirect(`/dashboard/billing?error=${encodeURIComponent("Billing isn't fully configured yet.")}`);
  }

  const paddle = new Paddle(apiKey!);
  await paddle.subscriptions.cancel(subscriptionId, { effectiveFrom: "next_billing_period" });

  const supabase = await createClient();
  await supabase.from("billing_events").insert({
    practice_id: practiceId,
    event_type: "subscription.cancel_requested",
    payload: { subscription_id: subscriptionId },
  });

  revalidatePath("/dashboard/billing");
}
