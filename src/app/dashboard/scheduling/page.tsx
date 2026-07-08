import { requireAdmin } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateDoctorProfile } from "@/lib/scheduling";
import { saveDoctorProfileAction } from "./actions";

const INSURANCE_OPTIONS = [
  "Aetna",
  "Cigna / eviCore",
  "UnitedHealthcare",
  "Humana",
  "BCBS / Anthem",
  "Medicare",
  "Medicaid",
];

const LANGUAGE_OPTIONS = ["English", "Spanish", "Mandarin", "Vietnamese", "Arabic", "Tagalog", "French", "Urdu/Hindi"];

export default async function SchedulingProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const session = await requireAdmin();
  const supabase = await createClient();

  const { data: authUser } = await supabase.auth.getUser();
  const { data: myProfile } = await supabase.from("profiles").select("full_name").eq("id", session.userId).single();

  const doctor = await getOrCreateDoctorProfile(
    supabase,
    session.practiceId,
    session.userId,
    myProfile?.full_name || authUser.user?.email || "Doctor"
  );

  const profileUrl = `/doctors/${doctor.slug}`;

  return (
    <div className="flex flex-col gap-6">
      {saved && (
        <div className="text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--success-bg)", color: "var(--success-green)" }}>
          Profile saved.
        </div>
      )}

      <div className="card p-5 flex items-center justify-between gap-4">
        <div>
          <div className="text-[14px] font-semibold mb-1">
            {doctor.public_enabled ? "Your profile is public" : "Your profile is private"}
          </div>
          <p className="text-[13px] text-gray-600">
            {doctor.public_enabled
              ? <>Patients can find and book you at <a className="text-indigo-600" href={profileUrl} target="_blank" rel="noreferrer">asaanbil.com{profileUrl}</a>.</>
              : "Turn this on once your profile, availability, and appointment types are ready — nothing is visible to patients until then."}
          </p>
        </div>
      </div>

      <form action={saveDoctorProfileAction} className="flex flex-col gap-5">
        <input type="hidden" name="doctor_profile_id" value={doctor.id} />

        <label className="card p-5 flex items-center justify-between gap-4 cursor-pointer">
          <div>
            <div className="text-[13.5px] font-semibold">Make my profile public on the Asaanbil directory</div>
            <div className="text-[12.5px] text-gray-400">Off by default — turn on when you&apos;re ready for patients to book.</div>
          </div>
          <input type="checkbox" name="public_enabled" defaultChecked={doctor.public_enabled} className="w-5 h-5 flex-shrink-0" />
        </label>

        <div className="card p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="credentials">Credentials</label>
            <input className="input" id="credentials" name="credentials" placeholder="MD, FAAOS" defaultValue={doctor.credentials || ""} />
          </div>
          <div>
            <label className="label" htmlFor="specialty">Specialty</label>
            <input className="input" id="specialty" name="specialty" placeholder="Orthopedic Surgery" defaultValue={doctor.specialty || ""} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="sub_specialties">Sub-specialties (comma separated)</label>
            <input
              className="input"
              id="sub_specialties"
              name="sub_specialties"
              placeholder="Sports Medicine, Spine, Joint Replacement"
              defaultValue={doctor.sub_specialties.join(", ")}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="photo_url">Profile photo URL</label>
            <input className="input" id="photo_url" name="photo_url" placeholder="https://..." defaultValue={doctor.photo_url || ""} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="bio">About (150 words max)</label>
            <textarea className="input" id="bio" name="bio" rows={4} defaultValue={doctor.bio || ""} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="conditions_treated">Conditions treated (comma separated)</label>
            <input
              className="input"
              id="conditions_treated"
              name="conditions_treated"
              placeholder="lower back pain, knee pain, rotator cuff"
              defaultValue={doctor.conditions_treated.join(", ")}
            />
          </div>
        </div>

        <div className="card p-5">
          <div className="label mb-2">Insurance accepted</div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {INSURANCE_OPTIONS.map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-[13.5px]">
                <input type="checkbox" name="insurance_accepted" value={opt} defaultChecked={doctor.insurance_accepted.includes(opt)} className="w-4 h-4" />
                {opt}
              </label>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="label mb-2">Languages spoken</div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {LANGUAGE_OPTIONS.map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-[13.5px]">
                <input type="checkbox" name="languages" value={opt} defaultChecked={doctor.languages.includes(opt)} className="w-4 h-4" />
                {opt}
              </label>
            ))}
          </div>
        </div>

        <div className="card p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex items-center gap-2 text-[13.5px]">
            <input type="checkbox" name="accepting_new_patients" defaultChecked={doctor.accepting_new_patients} className="w-4 h-4" />
            Accepting new patients
          </label>
          <label className="flex items-center gap-2 text-[13.5px]">
            <input type="checkbox" name="telehealth_available" defaultChecked={doctor.telehealth_available} className="w-4 h-4" />
            Telehealth available
          </label>
        </div>

        <div className="card p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="address_line1">Practice address</label>
            <input className="input" id="address_line1" name="address_line1" defaultValue={doctor.address_line1 || ""} />
          </div>
          <div>
            <label className="label" htmlFor="city">City</label>
            <input className="input" id="city" name="city" defaultValue={doctor.city || ""} />
          </div>
          <div>
            <label className="label" htmlFor="state">State</label>
            <input className="input" id="state" name="state" maxLength={2} defaultValue={doctor.state || ""} />
          </div>
          <div>
            <label className="label" htmlFor="zip">ZIP</label>
            <input className="input" id="zip" name="zip" defaultValue={doctor.zip || ""} />
          </div>
        </div>

        <button type="submit" className="btn btn-primary self-start">Save profile</button>
      </form>
    </div>
  );
}
