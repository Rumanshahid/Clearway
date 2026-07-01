import { NextResponse } from "next/server";
import { Paddle, EventName } from "@paddle/paddle-node-sdk";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// "Unlimited" letters on the Practice plan, represented as a very large cap
// rather than a separate null/unlimited code path.
const PRACTICE_PLAN_LETTERS_INCLUDED = 999_999;

function statusFromSubscriptionStatus(status: string): "active" | "grace_period" | "suspended" {
  if (status === "active" || status === "trialing") return "active";
  if (status === "past_due") return "grace_period";
  return "suspended"; // paused, canceled
}

export async function POST(request: Request) {
  const apiKey = process.env.PADDLE_API_KEY;
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!apiKey || !webhookSecret) {
    return NextResponse.json({ error: "Paddle is not configured" }, { status: 500 });
  }

  const signature = request.headers.get("paddle-signature") || "";
  const rawBody = await request.text();

  const paddle = new Paddle(apiKey);
  let eventData;
  try {
    eventData = await paddle.webhooks.unmarshal(rawBody, webhookSecret, signature);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (!eventData) {
    return NextResponse.json({ error: "Unrecognized event" }, { status: 400 });
  }

  const supabase = await createAdminClient();

  async function resolvePracticeId(customData: unknown, paddleCustomerId?: string | null): Promise<string | null> {
    const fromCustomData = (customData as { practice_id?: string } | null)?.practice_id;
    if (fromCustomData) return fromCustomData;
    if (paddleCustomerId) {
      const { data } = await supabase
        .from("practices")
        .select("id")
        .eq("paddle_customer_id", paddleCustomerId)
        .maybeSingle();
      return data?.id || null;
    }
    return null;
  }

  switch (eventData.eventType) {
    case EventName.SubscriptionCreated:
    case EventName.SubscriptionActivated: {
      const sub = eventData.data;
      const practiceId = await resolvePracticeId(sub.customData, sub.customerId);
      if (practiceId) {
        await supabase
          .from("practices")
          .update({
            plan: "practice",
            billing_status: "active",
            letters_included: PRACTICE_PLAN_LETTERS_INCLUDED,
            paddle_customer_id: sub.customerId,
            paddle_subscription_id: sub.id,
          })
          .eq("id", practiceId);
      }
      break;
    }

    case EventName.SubscriptionUpdated:
    case EventName.SubscriptionTrialing:
    case EventName.SubscriptionPastDue:
    case EventName.SubscriptionPaused:
    case EventName.SubscriptionResumed: {
      const sub = eventData.data;
      const practiceId = await resolvePracticeId(sub.customData, sub.customerId);
      if (practiceId) {
        await supabase
          .from("practices")
          .update({ billing_status: statusFromSubscriptionStatus(sub.status) })
          .eq("id", practiceId);
      }
      break;
    }

    case EventName.SubscriptionCanceled: {
      const sub = eventData.data;
      const practiceId = await resolvePracticeId(sub.customData, sub.customerId);
      if (practiceId) {
        await supabase.from("practices").update({ billing_status: "suspended" }).eq("id", practiceId);
      }
      break;
    }

    default:
      break;
  }

  // Audit log every event we understood, best-effort practice correlation.
  const dataRecord = eventData.data as { customData?: unknown; customerId?: string | null };
  const practiceId = await resolvePracticeId(dataRecord.customData, dataRecord.customerId);
  await supabase.from("billing_events").insert({
    practice_id: practiceId,
    event_type: eventData.eventType,
    payload: JSON.parse(JSON.stringify(eventData.data)),
  });

  return NextResponse.json({ received: true });
}
