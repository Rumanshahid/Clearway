import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { INSURANCE_COMPANIES, PLAN_TYPES, RELATIONSHIPS, PREFERRED_CONTACT_METHODS } from "@/lib/patients";
import { updatePatientProfileAction } from "./actions";

export default async function PatientProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("patient_profiles")
    .select("*")
    .eq("patient_account_id", user.id)
    .maybeSingle();

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-[20px] font-semibold mb-1">My Profile</h1>
      <p className="text-[14px] text-gray-600 mb-6">
        This is the same intake information your doctor&apos;s office would otherwise ask you for in person.
      </p>

      <form action={updatePatientProfileAction} className="flex flex-col gap-6">
        <section>
          <h2 className="text-[13.5px] font-semibold text-gray-700 mb-3">Contact Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label" htmlFor="address">Address</label>
              <input className="input" id="address" name="address" defaultValue={profile?.address ?? ""} />
            </div>
            <div>
              <label className="label" htmlFor="city">City</label>
              <input className="input" id="city" name="city" defaultValue={profile?.city ?? ""} />
            </div>
            <div>
              <label className="label" htmlFor="state">State</label>
              <input className="input" id="state" name="state" defaultValue={profile?.state ?? ""} />
            </div>
            <div>
              <label className="label" htmlFor="zip">Zip</label>
              <input className="input" id="zip" name="zip" defaultValue={profile?.zip ?? ""} />
            </div>
            <div>
              <label className="label" htmlFor="preferred_language">Preferred language</label>
              <input className="input" id="preferred_language" name="preferred_language" defaultValue={profile?.preferred_language ?? ""} />
            </div>
            <div>
              <label className="label" htmlFor="preferred_contact_method">Preferred contact method</label>
              <select className="input" id="preferred_contact_method" name="preferred_contact_method" defaultValue={profile?.preferred_contact_method ?? ""}>
                <option value="">Select…</option>
                {PREFERRED_CONTACT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-[13.5px] font-semibold text-gray-700 mb-3">Emergency Contact</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="emergency_contact_name">Name</label>
              <input className="input" id="emergency_contact_name" name="emergency_contact_name" defaultValue={profile?.emergency_contact_name ?? ""} />
            </div>
            <div>
              <label className="label" htmlFor="emergency_contact_phone">Phone</label>
              <input className="input" id="emergency_contact_phone" name="emergency_contact_phone" defaultValue={profile?.emergency_contact_phone ?? ""} />
            </div>
            <div>
              <label className="label" htmlFor="emergency_contact_relationship">Relationship</label>
              <select className="input" id="emergency_contact_relationship" name="emergency_contact_relationship" defaultValue={profile?.emergency_contact_relationship ?? ""}>
                <option value="">Select…</option>
                {RELATIONSHIPS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-[13.5px] font-semibold text-gray-700 mb-3">Primary Insurance</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="insurance_company">Insurance company</label>
              <select className="input" id="insurance_company" name="insurance_company" defaultValue={profile?.insurance_company ?? ""}>
                <option value="">Select…</option>
                {INSURANCE_COMPANIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="plan_type">Plan type</label>
              <select className="input" id="plan_type" name="plan_type" defaultValue={profile?.plan_type ?? ""}>
                <option value="">Select…</option>
                {PLAN_TYPES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="member_id">Member ID</label>
              <input className="input" id="member_id" name="member_id" defaultValue={profile?.member_id ?? ""} />
            </div>
            <div>
              <label className="label" htmlFor="group_number">Group number</label>
              <input className="input" id="group_number" name="group_number" defaultValue={profile?.group_number ?? ""} />
            </div>
            <div className="col-span-2">
              <label className="label" htmlFor="plan_name">Plan name</label>
              <input className="input" id="plan_name" name="plan_name" defaultValue={profile?.plan_name ?? ""} />
            </div>
          </div>
        </section>

        <section>
          <label className="flex items-center gap-2 text-[13.5px] font-semibold text-gray-700 mb-3">
            <input type="checkbox" name="has_secondary_insurance" defaultChecked={profile?.has_secondary_insurance ?? false} />
            I have secondary insurance
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="secondary_insurance_company">Secondary insurance company</label>
              <input className="input" id="secondary_insurance_company" name="secondary_insurance_company" defaultValue={profile?.secondary_insurance_company ?? ""} />
            </div>
            <div>
              <label className="label" htmlFor="secondary_member_id">Secondary member ID</label>
              <input className="input" id="secondary_member_id" name="secondary_member_id" defaultValue={profile?.secondary_member_id ?? ""} />
            </div>
            <div>
              <label className="label" htmlFor="secondary_group_number">Secondary group number</label>
              <input className="input" id="secondary_group_number" name="secondary_group_number" defaultValue={profile?.secondary_group_number ?? ""} />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-[13.5px] font-semibold text-gray-700 mb-3">Clinical</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="label" htmlFor="known_drug_allergies">Known drug allergies</label>
              <textarea className="input" id="known_drug_allergies" name="known_drug_allergies" rows={2} defaultValue={profile?.known_drug_allergies ?? ""} />
            </div>
            <div>
              <label className="label" htmlFor="current_medications">Current medications</label>
              <textarea className="input" id="current_medications" name="current_medications" rows={2} defaultValue={profile?.current_medications ?? ""} />
            </div>
          </div>
        </section>

        <button type="submit" className="btn btn-primary w-full justify-center">Save profile</button>
      </form>
    </div>
  );
}
