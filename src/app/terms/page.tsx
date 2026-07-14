import LegalLayout from "../LegalLayout";

export const metadata = {
  title: "Terms of Service — asaanbil.com",
  description: "The terms that govern use of asaanbil.com.",
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updated="July 8, 2026">
      <h2>1. Agreement to terms</h2>
      <p>
        These Terms of Service (&quot;Terms&quot;) govern access to and use of asaanbil.com (the &quot;Service&quot;), a
        prior-authorization and appeals workflow tool for U.S. medical practices. By creating an account or using the
        Service, you agree to these Terms on behalf of yourself and, if applicable, the practice you represent.
      </p>

      <h2>2. Who can use the Service</h2>
      <p>
        The Service is intended for licensed U.S. healthcare practices and their authorized staff. You must be at
        least 18 years old and able to enter a binding agreement to create an account.
      </p>

      <h2>3. What the Service does</h2>
      <p>
        asaanbil.com helps practices track patients, insurance claim denials, and appeal deadlines, and drafts prior
        authorization and appeal letters using publicly available payer criteria. The Service is a drafting and
        workflow aid — it does not practice medicine, give legal advice, or guarantee that any payer will approve a
        request. A qualified member of your practice is responsible for reviewing every letter and submission before
        it is sent to a payer.
      </p>

      <h2>4. Accounts</h2>
      <p>
        You are responsible for the accuracy of information you provide, for keeping your login credentials secure,
        and for all activity under your account. Tell us right away at{" "}
        <a href="mailto:hello@asaanbil.com">hello@asaanbil.com</a> if you suspect unauthorized access.
      </p>

      <h2>5. Plans and billing</h2>
      <p>
        The Pilot plan is free for a limited number of letters and requires no payment method. Paid plans (Practice
        and Multi-Site) are billed on a recurring monthly basis. Payments are processed by Stripe, Inc., our payment
        processor, which handles checkout and invoicing on our behalf; applicable sales tax is calculated and
        collected at checkout through Stripe Tax. By subscribing, you also agree to Stripe&apos;s terms of service.
        You can cancel a paid plan at any time from your Billing page; cancellation stops future charges and access
        continues through the end of the period already paid for. See our{" "}
        <a href="/refund-policy">Refund Policy</a> for details.
      </p>

      <h2>6. Acceptable use</h2>
      <p>
        You agree not to: use the Service for any patient without a legitimate treatment or billing relationship
        with your practice; submit false or fabricated clinical information; attempt to access another practice&apos;s
        data; reverse-engineer or resell the Service; or use it in a way that violates applicable law, including
        HIPAA.
      </p>

      <h2>7. Your data</h2>
      <p>
        Your practice owns the patient, claim, and account data you enter into the Service. We process it only to
        provide and support the Service, as described in our <a href="/privacy">Privacy Policy</a>. Where you enter
        Protected Health Information, we act as your business associate under HIPAA and will sign a Business
        Associate Agreement (BAA) on request.
      </p>

      <h2>8. Disclaimers</h2>
      <p>
        The Service is provided &quot;as is.&quot; Payer criteria, coverage policies, and appeal deadlines change, and
        while we aim to keep referenced criteria current, we do not guarantee that any letter, deadline, or coverage
        summary is complete, current, or error-free. Final responsibility for clinical accuracy and timely submission
        stays with your practice.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, asaanbil.com will not be liable for indirect, incidental, or
        consequential damages, or for lost revenue, arising from use of the Service. Our total liability for any
        claim relating to the Service is limited to the amount you paid us in the 3 months before the claim arose.
      </p>

      <h2>10. Termination</h2>
      <p>
        You may stop using the Service and close your account at any time. We may suspend or terminate accounts that
        violate these Terms or applicable law, or that we reasonably believe pose a security risk to other practices.
      </p>

      <h2>11. Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. If we make material changes, we&apos;ll notify account admins by
        email or in-app notice before the change takes effect.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions about these Terms can be sent to <a href="mailto:hello@asaanbil.com">hello@asaanbil.com</a>.
      </p>
    </LegalLayout>
  );
}
