import { requireAdmin } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateDoctorProfile } from "@/lib/scheduling";
import { saveNotificationPrefsAction } from "../actions";

export default async function NotificationPrefsPage() {
  const session = await requireAdmin();
  const supabase = await createClient();

  const { data: myProfile } = await supabase.from("profiles").select("full_name").eq("id", session.userId).single();
  const doctor = await getOrCreateDoctorProfile(supabase, session.practiceId, session.userId, myProfile?.full_name || "Doctor");

  const { data: prefs } = await supabase.from("notification_prefs").select("*").eq("doctor_profile_id", doctor.id).single();

  return (
    <form action={saveNotificationPrefsAction} className="card p-5 flex flex-col gap-4">
      <input type="hidden" name="doctor_profile_id" value={doctor.id} />

      <label className="flex items-center justify-between">
        <span className="text-[13.5px]">Email me for each new booking</span>
        <input type="checkbox" name="email_new_booking" defaultChecked={prefs?.email_new_booking ?? true} className="w-5 h-5" />
      </label>
      <label className="flex items-center justify-between">
        <span className="text-[13.5px]">Text me for each new booking</span>
        <input type="checkbox" name="sms_new_booking" defaultChecked={prefs?.sms_new_booking ?? false} className="w-5 h-5" />
      </label>
      <label className="flex items-center justify-between">
        <span className="text-[13.5px]">Daily summary email at 8am</span>
        <input type="checkbox" name="daily_summary_email" defaultChecked={prefs?.daily_summary_email ?? false} className="w-5 h-5" />
      </label>
      <label className="flex items-center justify-between">
        <span className="text-[13.5px]">Send patients a 24-hour reminder</span>
        <input type="checkbox" name="reminder_24h" defaultChecked={prefs?.reminder_24h ?? true} className="w-5 h-5" />
      </label>
      <label className="flex items-center justify-between">
        <span className="text-[13.5px]">Send patients a 2-hour reminder</span>
        <input type="checkbox" name="reminder_2h" defaultChecked={prefs?.reminder_2h ?? false} className="w-5 h-5" />
      </label>

      <div className="pt-2" style={{ borderTop: "1px solid var(--gray-200)" }}>
        <label className="label" htmlFor="cancellation_policy_hours">Patients must cancel at least this many hours ahead</label>
        <input
          className="input w-32"
          id="cancellation_policy_hours"
          name="cancellation_policy_hours"
          type="number"
          min={0}
          defaultValue={prefs?.cancellation_policy_hours ?? 24}
        />
      </div>

      <p className="text-[12px] text-gray-400">
        Text reminders require SMS to be configured for your account — until then, this toggle is saved but no
        messages will send.
      </p>

      <button type="submit" className="btn btn-primary self-start">Save</button>
    </form>
  );
}
