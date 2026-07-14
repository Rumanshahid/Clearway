import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// "Unlimited" letters on the Practice plan, represented as a very large cap
// rather than a separate null/unlimited code path.
const PRACTICE_PLAN_LETTERS_INCLUDED = 999_999;

function statusFromSubscriptionStatus(status: Stripe.Subscription.Status): "active" | "grace_period" | "suspended" {
  if (status === "active" || status === "trialing") return "active";
  if (status === "past_due" || status === "unpaid") return "grace_period";
  return "suspended"; // canceled, incomplete_expired, paused
}

function customerIdOf(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature") || "";
  const rawBody = await request.text();

  const stripe = new Stripe(secretKey);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const supabase = await createAdminClient();

  async function resolvePracticeId(metadata: Stripe.Metadata | null | undefined, stripeCustomerId: string | null): Promise<string | null> {
    const fromMetadata = metadata?.practice_id;
    if (fromMetadata) return fromMetadata;
    if (stripeCustomerId) {
      const { data } = await supabase.from("practices").select("id").eq("stripe_customer_id", stripeCustomerId).maybeSingle();
      return data?.id || null;
    }
    return null;
  }

  let practiceId: string | null = null;

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = customerIdOf(session.customer);
      practiceId = await resolvePracticeId(session.metadata, customerId);
      if (practiceId && session.subscription) {
        const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        await supabase
          .from("practices")
          .update({
            plan: "practice",
            billing_status: "active",
            letters_included: PRACTICE_PLAN_LETTERS_INCLUDED,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
          })
          .eq("id", practiceId);
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      practiceId = await resolvePracticeId(sub.metadata, customerIdOf(sub.customer));
      if (practiceId) {
        await supabase.from("practices").update({ billing_status: statusFromSubscriptionStatus(sub.status) }).eq("id", practiceId);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      practiceId = await resolvePracticeId(sub.metadata, customerIdOf(sub.customer));
      if (practiceId) {
        await supabase.from("practices").update({ billing_status: "suspended" }).eq("id", practiceId);
      }
      break;
    }

    default:
      break;
  }

  // Audit log every event we received, best-effort practice correlation.
  await supabase.from("billing_events").insert({
    practice_id: practiceId,
    event_type: event.type,
    payload: JSON.parse(JSON.stringify(event.data.object)),
  });

  return NextResponse.json({ received: true });
}
