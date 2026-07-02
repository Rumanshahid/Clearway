import { getSiteContent } from "@/lib/criteria-repo";
import { saveSiteContentAction } from "./actions";

function Field({ name, label, value, textarea }: { name: string; label: string; value: string; textarea?: boolean }) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      {textarea ? (
        <textarea className="input" id={name} name={name} rows={2} defaultValue={value} />
      ) : (
        <input className="input" id={name} name={name} defaultValue={value} />
      )}
    </div>
  );
}

export default async function AdminContentPage() {
  const content = await getSiteContent();
  const v = (key: string, fallback = "") => content[key]?.value ?? fallback;
  const visible = (key: string) => content[key]?.visible !== false;

  return (
    <div className="max-w-[760px] mx-auto py-8 px-5">
      <h1 className="text-[24px] font-semibold mb-1">Landing page content</h1>
      <p className="text-[14px] text-gray-600 mb-6">Edits go live on asaanbil.com immediately after saving.</p>

      <form action={saveSiteContentAction} className="flex flex-col gap-6">
        <section className="card p-6">
          <h2 className="text-[15px] font-semibold mb-4">Hero</h2>
          <div className="flex flex-col gap-4">
            <Field name="hero_headline" label="Headline" value={v("hero_headline", "Stop writing the same letter forty times a week.")} textarea />
            <Field name="hero_subheadline" label="Subheadline" value={v("hero_subheadline")} textarea />
            <Field name="hero_cta_primary" label="Primary CTA text" value={v("hero_cta_primary", "Start Free Pilot")} />
          </div>
        </section>

        <section className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold">Stats section</h2>
            <label className="flex items-center gap-2 text-[12.5px]">
              <input type="checkbox" name="visible_section_stats" defaultChecked={visible("section_stats")} className="w-4 h-4" />
              Visible
            </label>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex flex-col gap-2">
                <Field name={`stat${n}_number`} label={`Stat ${n} number`} value={v(`stat${n}_number`)} />
                <Field name={`stat${n}_label`} label={`Stat ${n} label`} value={v(`stat${n}_label`)} />
                <Field name={`stat${n}_copy`} label={`Stat ${n} copy`} value={v(`stat${n}_copy`)} textarea />
              </div>
            ))}
          </div>
        </section>

        <section className="card p-6">
          <label className="flex items-center gap-2 text-[13.5px]">
            <input type="checkbox" name="visible_section_insurers" defaultChecked={visible("section_insurers")} className="w-4 h-4" />
            Payer coverage section visible
          </label>
        </section>

        <section className="card p-6">
          <label className="flex items-center gap-2 text-[13.5px]">
            <input type="checkbox" name="visible_section_compare" defaultChecked={visible("section_compare")} className="w-4 h-4" />
            &quot;The Difference&quot; comparison carousel visible
          </label>
        </section>

        <section className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold">Pricing section</h2>
            <label className="flex items-center gap-2 text-[12.5px]">
              <input type="checkbox" name="visible_section_pricing" defaultChecked={visible("section_pricing")} className="w-4 h-4" />
              Visible
            </label>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field name="pricing_pilot_price" label="Pilot price" value={v("pricing_pilot_price", "Free")} />
            <Field name="pricing_practice_price" label="Practice price" value={v("pricing_practice_price", "$249")} />
            <Field name="pricing_multisite_price" label="Multi-Site price" value={v("pricing_multisite_price", "Custom")} />
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-[15px] font-semibold mb-4">Final CTA</h2>
          <div className="flex flex-col gap-4">
            <Field name="cta_final_headline" label="Headline" value={v("cta_final_headline")} />
            <Field name="cta_final_copy" label="Copy" value={v("cta_final_copy")} />
          </div>
        </section>

        <button className="btn btn-primary self-start" type="submit">Save changes</button>
      </form>
    </div>
  );
}
