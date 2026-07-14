import LegalLayout from "../LegalLayout";

export const metadata = {
  title: "Refund Policy — asaanbil.com",
  description: "How billing, cancellation, and refunds work on asaanbil.com.",
};

export default function RefundPolicyPage() {
  return (
    <LegalLayout title="Refund Policy" updated="July 8, 2026">
      <h2>1. Free Pilot</h2>
      <p>
        The Pilot plan is free and does not require a payment method, so no charge — and no refund — is ever
        involved while you&apos;re on it.
      </p>

      <h2>2. Paid plans</h2>
      <p>
        Practice and Multi-Site plans are billed monthly in advance through Stripe, our payment processor. Because
        each billing period grants a full month of access starting immediately, we generally don&apos;t issue
        refunds for partial or unused portions of a billing period.
      </p>

      <h2>3. Cancelling a subscription</h2>
      <p>
        You can cancel a paid plan at any time from your account&apos;s Billing page. Cancelling stops future
        renewals — you won&apos;t be charged again — and you keep access through the end of the period you already
        paid for. There&apos;s no partial-month refund for cancelling early.
      </p>

      <h2>4. Billing errors</h2>
      <p>
        If you&apos;re charged in error — for example, a duplicate charge or a charge after you cancelled — contact
        us at <a href="mailto:hello@asaanbil.com">hello@asaanbil.com</a>{" "}
        and we&apos;ll investigate and correct it, including a refund where one is due.
      </p>

      <h2>5. Stripe as our payment processor</h2>
      <p>
        Stripe processes the actual transaction on our behalf; our business name appears on your card statement.
        Your checkout receipt includes Stripe&apos;s own support contact, which you can also use for
        payment-specific questions.
      </p>

      <h2>6. Contact</h2>
      <p>
        For any billing or refund question, reach us at{" "}
        <a href="mailto:hello@asaanbil.com">hello@asaanbil.com</a>.
      </p>
    </LegalLayout>
  );
}
