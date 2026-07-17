import type { createClient } from "@/lib/supabase/server";

// Shared by password sign-in and the OAuth callback -- both need the same
// "where does this person actually belong" logic (patient vs staff vs
// doctor/admin vs incomplete-onboarding), so it lives in one place rather
// than drifting out of sync between the two entry points.
export async function resolvePostLoginPath(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string> {
  const { data: patientAccount } = await supabase.from("patient_accounts").select("id").eq("id", userId).maybeSingle();
  if (patientAccount) return "/patient";

  const { data: profile } = await supabase.from("profiles").select("practice_id, role").eq("id", userId).maybeSingle();
  if (!profile?.practice_id) return "/onboarding";

  // clinic_admin ("Doctor / Admin") and super_admin land on the actual
  // dashboard overview, not the PA-requests list that sits at the bare
  // /dashboard route -- only plain staff (clinic_user) go there.
  const isAdmin = profile.role === "clinic_admin" || profile.role === "super_admin";
  return isAdmin ? "/dashboard/overview" : "/dashboard";
}
