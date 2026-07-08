import { requireAdmin } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateDoctorProfile } from "@/lib/scheduling";
import { createAppointmentTypeAction, updateAppointmentTypeAction, deleteAppointmentTypeAction } from "../actions";

export default async function AppointmentTypesPage() {
  const session = await requireAdmin();
  const supabase = await createClient();

  const { data: myProfile } = await supabase.from("profiles").select("full_name").eq("id", session.userId).single();
  const doctor = await getOrCreateDoctorProfile(supabase, session.practiceId, session.userId, myProfile?.full_name || "Doctor");

  const { data: types } = await supabase
    .from("appointment_types")
    .select("*")
    .eq("doctor_profile_id", doctor.id)
    .order("sort_order");

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] text-gray-600">
        Each type has its own duration — a 60-minute New Patient visit and a 15-minute Follow-up, for example. The AI
        booking flow uses these to route patients to the right slot length.
      </p>

      {(types || []).map((t) => (
        <form key={t.id} action={updateAppointmentTypeAction} className="card p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input type="hidden" name="id" value={t.id} />
          <input type="hidden" name="doctor_profile_id" value={doctor.id} />

          <div>
            <label className="label">Name</label>
            <input className="input" name="name" defaultValue={t.name} required />
          </div>
          <div>
            <label className="label">Duration (minutes)</label>
            <input className="input" name="duration_minutes" type="number" min={5} defaultValue={t.duration_minutes} required />
          </div>
          <div>
            <label className="label">Buffer after (minutes)</label>
            <input className="input" name="buffer_minutes" type="number" min={0} defaultValue={t.buffer_minutes} />
          </div>
          <div className="flex items-center gap-5 sm:col-span-2">
            <label className="flex items-center gap-2 text-[13.5px]">
              <input type="checkbox" name="is_new_patient" defaultChecked={t.is_new_patient} className="w-4 h-4" />
              New patient visit
            </label>
            <label className="flex items-center gap-2 text-[13.5px]">
              <input type="checkbox" name="is_telehealth" defaultChecked={t.is_telehealth} className="w-4 h-4" />
              Telehealth
            </label>
            <label className="flex items-center gap-2 text-[13.5px]">
              <input type="checkbox" name="active" defaultChecked={t.active} className="w-4 h-4" />
              Active (bookable)
            </label>
          </div>

          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" className="btn btn-outline btn-sm">Save</button>
            <button type="submit" formAction={deleteAppointmentTypeAction} className="text-btn text-[12.5px] text-gray-400">
              Delete
            </button>
          </div>
        </form>
      ))}

      <form action={createAppointmentTypeAction} className="card p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input type="hidden" name="doctor_profile_id" value={doctor.id} />
        <div className="sm:col-span-2 text-[13.5px] font-semibold">Add appointment type</div>
        <div>
          <label className="label">Name</label>
          <input className="input" name="name" placeholder="New Patient" required />
        </div>
        <div>
          <label className="label">Duration (minutes)</label>
          <input className="input" name="duration_minutes" type="number" min={5} defaultValue={30} required />
        </div>
        <div>
          <label className="label">Buffer after (minutes)</label>
          <input className="input" name="buffer_minutes" type="number" min={0} defaultValue={10} />
        </div>
        <div className="flex items-center gap-5">
          <label className="flex items-center gap-2 text-[13.5px]">
            <input type="checkbox" name="is_new_patient" className="w-4 h-4" />
            New patient visit
          </label>
          <label className="flex items-center gap-2 text-[13.5px]">
            <input type="checkbox" name="is_telehealth" className="w-4 h-4" />
            Telehealth
          </label>
        </div>
        <button type="submit" className="btn btn-primary self-start sm:col-span-2">Add type</button>
      </form>
    </div>
  );
}
