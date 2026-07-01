import { completeOnboardingAction } from "./actions";

const PAYER_OPTIONS = ["Aetna", "Cigna / eviCore", "UnitedHealthcare", "Humana", "BCBS / Anthem", "Other"];

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-5">
      <div className="max-w-[640px] mx-auto">
        <h1 className="text-[26px] font-semibold mb-1">Set up your practice</h1>
        <p className="text-[14px] text-gray-600 mb-8">
          Takes about two minutes. You can change any of this later in Account Settings.
        </p>

        {error && (
          <div className="mb-5 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
            {error}
          </div>
        )}

        <form action={completeOnboardingAction} className="card p-7 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label" htmlFor="name">Practice name</label>
              <input className="input" id="name" name="name" required />
            </div>
            <div className="col-span-2">
              <label className="label" htmlFor="address">Address</label>
              <input className="input" id="address" name="address" />
            </div>
            <div>
              <label className="label" htmlFor="npi">NPI number</label>
              <input className="input" id="npi" name="npi" />
            </div>
            <div>
              <label className="label" htmlFor="specialty">Specialty</label>
              <input className="input" id="specialty" name="specialty" placeholder="e.g. Orthopedics" />
            </div>
          </div>

          <div>
            <label className="label">Primary payer(s) you deal with</label>
            <div className="grid grid-cols-2 gap-2">
              {PAYER_OPTIONS.map((payer) => (
                <label key={payer} className="flex items-center gap-2 text-[13.5px] text-gray-900">
                  <input type="checkbox" name="primary_payers" value={payer} className="w-4 h-4" />
                  {payer}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="label" htmlFor="staff_count">Number of staff who&apos;ll use Clearway</label>
            <input className="input max-w-[140px]" id="staff_count" name="staff_count" type="number" min={1} defaultValue={1} required />
          </div>

          <div>
            <label className="label">Choose a plan</label>
            <div className="grid grid-cols-3 gap-3">
              <PlanCard value="pilot" title="Pilot" price="Free" desc="10 letters" defaultChecked />
              <PlanCard value="practice" title="Practice" price="$249/mo" desc="Unlimited" />
              <PlanCard value="multi_site" title="Multi-Site" price="Custom" desc="Volume pricing" />
            </div>
            <p className="text-[12px] text-gray-400 mt-2">
              Billing setup for paid plans is enabled after your pilot — you won&apos;t be charged today.
            </p>
          </div>

          <div className="border rounded-[12px] p-4" style={{ borderColor: "var(--gray-200)" }}>
            <label className="label mb-2">Business Associate Agreement</label>
            <div className="text-[12.5px] text-gray-600 leading-relaxed mb-3 max-h-[140px] overflow-y-auto pr-1">
              <p className="mb-2">
                By checking the box below, {"{Practice Name}"} (&quot;Covered Entity&quot;) and Clearway (&quot;Business
                Associate&quot;) agree that Clearway may access, process, and store protected health information
                (PHI) submitted through the platform solely to provide the prior-authorization drafting service,
                in accordance with HIPAA&apos;s Privacy, Security, and Breach Notification Rules.
              </p>
              <p className="mb-2">
                Clearway will: (1) use PHI only as permitted by this Agreement or required by law; (2) apply
                appropriate administrative, physical, and technical safeguards; (3) report any unauthorized use or
                disclosure without unreasonable delay; and (4) ensure any subcontractor with access to PHI (including
                Anthropic, under Clearway&apos;s own BAA with Anthropic) agrees to the same restrictions.
              </p>
              <p>
                This summary is provided for onboarding convenience. The full, signed agreement will be countersigned
                and emailed to your practice administrator, and supersedes this summary.
              </p>
            </div>
            <label className="flex items-start gap-2 text-[13px] text-gray-900">
              <input type="checkbox" name="baa_accepted" required className="w-4 h-4 mt-0.5" />
              <span>I have authority to accept this Agreement on behalf of my practice, and I accept its terms.</span>
            </label>
          </div>

          <button className="btn btn-primary w-full justify-center" type="submit">
            Finish setup →
          </button>
        </form>
      </div>
    </div>
  );
}

function PlanCard({
  value,
  title,
  price,
  desc,
  defaultChecked,
}: {
  value: string;
  title: string;
  price: string;
  desc: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="border rounded-[12px] p-3 cursor-pointer flex flex-col gap-0.5 has-[:checked]:border-indigo-600 has-[:checked]:border-2" style={{ borderColor: "var(--gray-200)" }}>
      <input type="radio" name="plan" value={value} defaultChecked={defaultChecked} className="sr-only" />
      <span className="text-[12px] font-semibold text-indigo-600 uppercase tracking-wide">{title}</span>
      <span className="text-[16px] font-medium">{price}</span>
      <span className="text-[12px] text-gray-400">{desc}</span>
    </label>
  );
}
