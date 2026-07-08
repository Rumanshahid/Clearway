import { requireAdmin } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateDoctorProfile } from "@/lib/scheduling";
import { updateIntakeQuestionAction, addIntakeQuestionAction, deleteIntakeQuestionAction } from "../actions";

export default async function IntakeQuestionsPage() {
  const session = await requireAdmin();
  const supabase = await createClient();

  const { data: myProfile } = await supabase.from("profiles").select("full_name").eq("id", session.userId).single();
  const doctor = await getOrCreateDoctorProfile(supabase, session.practiceId, session.userId, myProfile?.full_name || "Doctor");

  const { data: questions } = await supabase
    .from("intake_questions")
    .select("*")
    .eq("doctor_profile_id", doctor.id)
    .order("sort_order");

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] text-gray-600">
        The AI booking assistant asks these before offering appointment times. The six starred questions feed
        directly into routing (appointment type, duration, urgency) — you can edit their wording but not remove them.
        Add your own questions below for anything extra you want collected as a note.
      </p>

      {(questions || []).map((q) => (
        <form key={q.id} action={updateIntakeQuestionAction} className="card p-4 flex items-center gap-3">
          <input type="hidden" name="id" value={q.id} />
          <input type="hidden" name="doctor_profile_id" value={doctor.id} />
          <span className="text-gray-400 text-[13px] flex-shrink-0">{q.question_key ? "★" : "—"}</span>
          <input className="input flex-1" name="question_text" defaultValue={q.question_text} required />
          <label className="flex items-center gap-1.5 text-[12.5px] text-gray-600 flex-shrink-0">
            <input type="checkbox" name="active" defaultChecked={q.active} className="w-4 h-4" />
            Active
          </label>
          <button type="submit" className="btn btn-outline btn-sm flex-shrink-0">Save</button>
          {!q.question_key && (
            <button type="submit" formAction={deleteIntakeQuestionAction} className="text-btn text-[12.5px] text-gray-400 flex-shrink-0">
              Delete
            </button>
          )}
        </form>
      ))}

      <form action={addIntakeQuestionAction} className="card p-4 flex items-center gap-3">
        <input type="hidden" name="doctor_profile_id" value={doctor.id} />
        <input className="input flex-1" name="question_text" placeholder="Add a custom question..." required />
        <button type="submit" className="btn btn-outline btn-sm flex-shrink-0">Add</button>
      </form>
    </div>
  );
}
