import { createClient } from "@/lib/supabase/server";
import { requireSectionAccess } from "@/lib/permissions";
import NewPatientClient from "./NewPatientClient";

export default async function NewPatientPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  await requireSectionAccess("patients");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("practice_id")
    .eq("id", user!.id)
    .single();

  const { data: physicians } = await supabase
    .from("physicians")
    .select("id, name, credentials, npi, direct_phone, specialty, fax")
    .eq("practice_id", profile!.practice_id!)
    .order("name");

  return (
    <div className="max-w-[900px] mx-auto py-8 px-5">
      <h1 className="text-[24px] font-semibold mb-1">Add patient</h1>
      <p className="text-[14px] text-gray-600 mb-6">
        Only the fields your team actually needs — pick which sections to show, add extras from &quot;More options&quot;
        as they come up, or bulk-import an existing roster.
      </p>

      {error && (
        <div className="mb-5 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
          {error}
        </div>
      )}

      <NewPatientClient physicians={physicians || []} />
    </div>
  );
}
