import LegalLayout from "../LegalLayout";

export const metadata = {
  title: "Privacy Policy — asaanbil.com",
  description: "How asaanbil.com collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="July 8, 2026">
      <h2>1. Overview</h2>
      <p>
        This Privacy Policy explains what information asaanbil.com collects, how we use it, and the choices you
        have. It applies to the marketing site and the logged-in practice dashboard.
      </p>

      <h2>2. Information we collect</h2>
      <p>
        <strong>Account information</strong> — name, email, practice name, and role, provided when you sign up or are
        invited to a practice.
      </p>
      <p>
        <strong>Practice, patient, and claim data</strong> — the information your practice enters to use the
        Service, which may include Protected Health Information (PHI) such as patient names, dates of birth,
        insurance details, diagnoses, and claim/denial records. This data is entered and controlled by your practice;
        we process it only to provide the Service.
      </p>
      <p>
        <strong>Payment information</strong> — handled entirely by Paddle.com, our payment processor and merchant of
        record. We do not receive or store full card numbers.
      </p>
      <p>
        <strong>Usage information</strong> — basic technical data such as browser type and pages visited, and
        session cookies needed to keep you signed in.
      </p>

      <h2 id="hipaa">3. How we handle Protected Health Information (HIPAA)</h2>
      <p>
        For practices that enter PHI, we act as a business associate under the Health Insurance Portability and
        Accountability Act (HIPAA). We sign a Business Associate Agreement (BAA) with covered-entity customers on
        request, and we use PHI only to provide, maintain, and support the Service — never for advertising, and never
        sold to third parties.
      </p>
      <p>
        Safeguards include encryption of data in transit and at rest, role-based access within your practice&apos;s
        account so staff only see what their role permits, and audit logging of access to sensitive records. No
        method of transmission or storage is 100% secure, but we design the Service around minimizing who can see
        PHI and why.
      </p>

      <h2>4. How we use information</h2>
      <ul>
        <li>To provide the core Service — drafting letters, tracking patients, denials, and deadlines</li>
        <li>To authenticate accounts and enforce practice-level data isolation</li>
        <li>To provide customer support</li>
        <li>To send billing notices and, if you opt in, product updates</li>
        <li>To maintain the security and reliability of the Service</li>
      </ul>

      <h2>5. Who we share data with</h2>
      <p>
        We use a small number of infrastructure providers (sub-processors) to run the Service: Supabase for database
        hosting, authentication, and file storage, and Paddle for payment processing. These providers only receive
        the data needed to perform their function and are bound by their own confidentiality and security
        obligations. We do not sell practice or patient data, and we do not share it with insurers, employers, or
        data brokers.
      </p>

      <h2>6. Data retention and deletion</h2>
      <p>
        We retain practice and patient data for as long as your account is active, or as needed to comply with legal
        and record-keeping obligations. On request, or when an account is closed, we will delete or return your
        data within a reasonable period, subject to any retention required by law.
      </p>

      <h2>7. Your choices</h2>
      <p>
        You can access, correct, or request deletion of information tied to your account by contacting{" "}
        <a href="mailto:hello@asaanbil.com">hello@asaanbil.com</a>. Requests concerning individual patient records
        should go through your practice, since your practice controls that data.
      </p>

      <h2>8. Cookies</h2>
      <p>
        We use only the cookies necessary to keep you signed in and to remember basic preferences. We do not use
        third-party advertising or tracking cookies on the Service.
      </p>

      <h2>9. Children&apos;s privacy</h2>
      <p>
        asaanbil.com is a business tool for healthcare practices and is not directed at, or knowingly used by,
        individual consumers or children.
      </p>

      <h2>10. Changes to this policy</h2>
      <p>
        If we make material changes to this policy, we&apos;ll notify account admins by email or in-app notice before
        the change takes effect.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions about this policy can be sent to <a href="mailto:hello@asaanbil.com">hello@asaanbil.com</a>.
      </p>
    </LegalLayout>
  );
}
