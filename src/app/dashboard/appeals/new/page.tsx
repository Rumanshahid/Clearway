import { createClient } from "@/lib/supabase/server";
import ClaimDenialForm from "./ClaimDenialForm";

export const maxDuration = 60;

export default async function NewClaimDenialPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("practice_id")
    .eq("id", user!.id)
    .single();
  const practiceId = profile!.practice_id!;

  const [{ data: patients }, { data: paRequests }] = await Promise.all([
    supabase.from("patients").select("id, first_name, last_name").eq("practice_id", practiceId).order("last_name"),
    supabase.from("pa_requests").select("id, patient_reference, procedure_type, patient_id").eq("practice_id", practiceId),
  ]);

  return (
    <div className="max-w-[760px] mx-auto py-8 px-5">
      <h1 className="text-[24px] font-semibold mb-1">Log a claim denial</h1>
      <p className="text-[14px] text-gray-600 mb-6">
        Asaanbil routes the right appeal type from the denial reason code and drafts the letter automatically.
      </p>

      {error && (
        <div className="mb-5 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
          {error}
        </div>
      )}

      <ClaimDenialForm patients={patients || []} paRequests={paRequests || []} />
    </div>
  );
}
