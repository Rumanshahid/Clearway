"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

// Redirects straight to Stripe's hosted Checkout page -- the actual plan
// upgrade happens off the webhook (checkout.session.completed), not here,
// same as the Paddle flow this replaces.
export async function createCheckoutSessionAction(formData: FormData) {
  const practiceId = String(formData.get("practice_id") || "");
  const email = String(formData.get("email") || "");
  const priceId = process.env.STRIPE_PRICE_ID_PRACTICE;

  if (!priceId) {
    redirect(`/dashboard/billing?error=${encodeURIComponent("Billing isn't configured yet — set STRIPE_PRICE_ID_PRACTICE in .env.local.")}`);
  }

  const supabase = await createClient();
  const { data: practice } = await supabase.from("practices").select("stripe_customer_id").eq("id", practiceId).single();

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    ...(practice?.stripe_customer_id ? { customer: practice.stripe_customer_id } : { customer_email: email }),
    client_reference_id: practiceId,
    metadata: { practice_id: practiceId },
    subscription_data: { metadata: { practice_id: practiceId } },
    // Stripe Tax needs a customer location to calculate the right rate --
    // this collects it at checkout rather than requiring it be on file already.
    automatic_tax: { enabled: true },
    billing_address_collection: "required",
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/billing?upgraded=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/billing`,
  });

  if (session.url) redirect(session.url);
}

export async function cancelSubscriptionAction(formData: FormData) {
  const practiceId = String(formData.get("practice_id") || "");
  const subscriptionId = String(formData.get("subscription_id") || "");

  if (!subscriptionId) {
    redirect(`/dashboard/billing?error=${encodeURIComponent("Billing isn't fully configured yet.")}`);
  }

  const stripe = getStripeClient();
  await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });

  const supabase = await createClient();
  await supabase.from("billing_events").insert({
    practice_id: practiceId,
    event_type: "subscription.cancel_requested",
    payload: { subscription_id: subscriptionId },
  });

  revalidatePath("/dashboard/billing");
}
