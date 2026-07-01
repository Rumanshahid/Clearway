"use client";

import { useState } from "react";
import type { Paddle } from "@paddle/paddle-js";
import { initializePaddle } from "@paddle/paddle-js";

export default function UpgradeButton({
  practiceId,
  email,
}: {
  practiceId: string;
  email: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade() {
    const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_PRACTICE;
    const environment = (process.env.NEXT_PUBLIC_PADDLE_ENV || "sandbox") as "sandbox" | "production";

    if (!clientToken || !priceId) {
      setError("Billing isn't configured yet — set the Paddle env vars in .env.local.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const paddle: Paddle | undefined = await initializePaddle({ token: clientToken, environment });
      if (!paddle) throw new Error("Paddle failed to initialize");

      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: { email },
        customData: { practice_id: practiceId },
        settings: {
          successUrl: `${window.location.origin}/dashboard/billing?upgraded=1`,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open checkout");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button className="btn btn-primary" type="button" onClick={handleUpgrade} disabled={loading}>
        {loading ? "Opening checkout…" : "Upgrade to Practice — $249/mo"}
      </button>
      {error && <p className="text-[12.5px] mt-2" style={{ color: "var(--danger-red)" }}>{error}</p>}
    </div>
  );
}
