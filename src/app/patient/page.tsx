import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { calculateProfileCompletion } from "@/lib/patient-profile";
import { PATIENT_DASHBOARD_SECTIONS } from "@/lib/patientDashboard";
import { getPatientDoctors } from "@/lib/patientDoctors";
import PatientDashboardCustomizer from "./PatientDashboardCustomizer";
import { setPatientDoctorAccessAction } from "./access-actions";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6">
      <h2 className="text-[14px] font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default async function PatientHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: account } = await supabase
    .from("patient_accounts")
    .select("first_name, patient_ref_id, email, dashboard_hidden_sections")
    .eq("id", user.id)
    .single();
  if (!account) redirect("/dashboard");

  const { data: profile } = await supabase
    .from("patient_profiles")
    .select("*")
    .eq("patient_account_id", user.id)
    .maybeSingle();

  const completion = calculateProfileCompletion(profile);
  const hidden = new Set(account.dashboard_hidden_sections || []);

  // Appointments/doctor-directory tables have no RLS path a patient
  // session can read (they're scoped to practice staff) -- this dashboard
  // deliberately reads across practices by email match, so it needs the
  // service-role client the same way the doctor-side access lookup does.
  const admin = await createAdminClient();

  const { data: appointments } = await admin
    .from("appointments")
    .select("id, doctor_profile_id, reason_for_visit, start_at, status")
    .ilike("patient_email", account.email)
    .order("start_at", { ascending: false })
    .limit(10);

  const allowedDoctors = await getPatientDoctors(admin, user.id, account.email);
  const nameByDoctorId = new Map(allowedDoctors.map((d) => [d.id, d.name]));

  return (
    <div className="max-w-[900px] mx-auto px-5 sm:px-10 py-10">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-1">
        <div>
          <h1 className="text-[20px] font-semibold">Dashboard</h1>
          <p className="text-[13px] text-gray-500 mt-1">
            Welcome back, {account.first_name} · <span className="text-gray-400">{account.patient_ref_id}</span>
          </p>
        </div>
        <PatientDashboardCustomizer sections={PATIENT_DASHBOARD_SECTIONS} initialHidden={Array.from(hidden)} />
      </div>

      <div className="rounded-2xl border border-gray-200 p-5 flex items-center justify-between gap-4 flex-wrap my-6" style={{ background: "#fff" }}>
        <div>
          <p className="text-[12px] uppercase tracking-wide text-gray-500 mb-1">Profile completion</p>
          <div className="flex items-center gap-3">
            <div className="h-2 w-[160px] rounded-full bg-gray-200">
              <div className="h-2 rounded-full bg-indigo-600" style={{ width: `${completion}%` }} />
            </div>
            <span className="text-[13px] text-gray-600">{completion}%</span>
          </div>
        </div>
        <a href="/api/patient/card" className="btn btn-outline btn-sm">Download Patient Card</a>
        {completion < 100 && (
          <Link href="/patient/profile" className="btn btn-primary btn-sm">Complete profile →</Link>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {!hidden.has("appointments") && (
          <SectionCard title="Recent Appointments">
            {(appointments || []).length === 0 ? (
              <p className="text-[13px] text-gray-400">No appointments on file yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {(appointments || []).map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-3 pb-3" style={{ borderBottom: "1px solid var(--gray-100)" }}>
                    <div>
                      <div className="text-[13.5px] font-medium text-gray-900">{nameByDoctorId.get(a.doctor_profile_id) || "Doctor"}</div>
                      <div className="text-[12.5px] text-gray-500">{a.reason_for_visit || "Visit"}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[12.5px] text-gray-600">{new Date(a.start_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</div>
                      <div className="text-[11.5px] text-gray-400">{new Date(a.start_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        )}

        {!hidden.has("medical_history") && (
          <SectionCard title="Medical History">
            <p className="text-[13.5px] text-gray-700 whitespace-pre-wrap">
              {profile?.medical_history?.trim() || <span className="text-gray-400">Nothing on file — add this from your profile.</span>}
            </p>
          </SectionCard>
        )}

        {!hidden.has("allowed_doctors") && (
          <SectionCard title="Allowed Doctors">
            <p className="text-[12.5px] text-gray-500 mb-4">
              Doctors you&apos;ve had an appointment with, or who&apos;ve requested access. Tick a box to let that doctor see your self-entered profile information.
            </p>
            {allowedDoctors.length === 0 ? (
              <p className="text-[13px] text-gray-400">No doctors yet.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {allowedDoctors.map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5" style={{ background: "var(--gray-50)" }}>
                    <div>
                      <div className="text-[13.5px] font-medium text-gray-900">{d.name}</div>
                      {d.specialty && <div className="text-[12px] text-gray-500">{d.specialty}</div>}
                      {d.requested && <div className="text-[11.5px] mt-0.5" style={{ color: "var(--amber)" }}>Requested access</div>}
                    </div>
                    <form action={setPatientDoctorAccessAction}>
                      <input type="hidden" name="doctor_profile_id" value={d.id} />
                      <input type="hidden" name="grant" value={d.accessGranted ? "0" : "1"} />
                      <button
                        type="submit"
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ border: d.accessGranted ? "none" : "1.5px solid var(--gray-400)", background: d.accessGranted ? "var(--success-green)" : "transparent" }}
                        aria-label={d.accessGranted ? "Revoke access" : "Grant access"}
                        title={d.accessGranted ? "Access granted — click to revoke" : "Click to grant access"}
                      >
                        {d.accessGranted && (
                          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                            <path d="M3 8.5l3.2 3.2L13 4.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        )}

        {!hidden.has("allergies") && (
          <SectionCard title="Allergies & Medications">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-[11.5px] uppercase tracking-wide text-gray-400 font-semibold mb-1">Known drug allergies</div>
                <div className="text-[13.5px] text-gray-900">{profile?.known_drug_allergies?.trim() || <span className="text-gray-400">Not provided</span>}</div>
              </div>
              <div>
                <div className="text-[11.5px] uppercase tracking-wide text-gray-400 font-semibold mb-1">Current medications</div>
                <div className="text-[13.5px] text-gray-900">{profile?.current_medications?.trim() || <span className="text-gray-400">Not provided</span>}</div>
              </div>
            </div>
          </SectionCard>
        )}

        {!hidden.has("insurance") && (
          <SectionCard title="Insurance Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-[11.5px] uppercase tracking-wide text-gray-400 font-semibold mb-1">Insurance company</div>
                <div className="text-[13.5px] text-gray-900">{profile?.insurance_company || <span className="text-gray-400">Not provided</span>}</div>
              </div>
              <div>
                <div className="text-[11.5px] uppercase tracking-wide text-gray-400 font-semibold mb-1">Plan type</div>
                <div className="text-[13.5px] text-gray-900">{profile?.plan_type || <span className="text-gray-400">Not provided</span>}</div>
              </div>
              <div>
                <div className="text-[11.5px] uppercase tracking-wide text-gray-400 font-semibold mb-1">Member ID</div>
                <div className="text-[13.5px] text-gray-900">{profile?.member_id || <span className="text-gray-400">Not provided</span>}</div>
              </div>
              <div>
                <div className="text-[11.5px] uppercase tracking-wide text-gray-400 font-semibold mb-1">Group number</div>
                <div className="text-[13.5px] text-gray-900">{profile?.group_number || <span className="text-gray-400">Not provided</span>}</div>
              </div>
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}
