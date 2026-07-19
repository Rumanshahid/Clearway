import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { PatientContactInfo } from "@/lib/patient-letters";

// Shared by both patient/pa and patient/appeals letter-drafting actions --
// pulls the patient's identity + self-entered insurance/address info so the
// letter is fully populated without asking the patient to retype insurance
// details they've already given once in their profile.
export async function loadPatientLetterContext(admin: SupabaseClient<Database>, userId: string) {
  const [{ data: account }, { data: profile }] = await Promise.all([
    admin.from("patient_accounts").select("first_name, last_name, dob, patient_ref_id, mobile_phone, email").eq("id", userId).single(),
    admin
      .from("patient_profiles")
      .select("address, city, state, zip, insurance_company, member_id, group_number, plan_name")
      .eq("patient_account_id", userId)
      .maybeSingle(),
  ]);

  if (!account) throw new Error("Patient account not found.");

  const contact: PatientContactInfo = {
    address: profile?.address,
    city: profile?.city,
    state: profile?.state,
    zip: profile?.zip,
    phone: account.mobile_phone,
    email: account.email,
    insuranceCompany: profile?.insurance_company,
    memberId: profile?.member_id,
    groupNumber: profile?.group_number,
    planName: profile?.plan_name,
  };

  return {
    patientFullName: `${account.first_name} ${account.last_name}`,
    patientDob: account.dob,
    patientRefId: account.patient_ref_id,
    contact,
  };
}
