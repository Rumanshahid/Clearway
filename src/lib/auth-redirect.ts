import { createAdminClient } from "@/lib/supabase/server";

// Shared by password sign-in and the OAuth callback -- both need the same
// "where does this staff member actually belong" logic (doctor/admin vs
// plain staff vs incomplete-onboarding), so it lives in one place rather
// than drifting out of sync between the two entry points.
//
// Uses the service-role client for the profiles lookup, not the caller's
// session-scoped client -- this is a pure identity-routing check ("does
// auth.uid() X have a practice"), always filtered to the already-verified
// `userId` argument, so it can't leak anyone else's data. Sidesteps a
// real-world case where a freshly authenticated session's own RLS-scoped
// read of its own row intermittently came back empty even though the row
// and policy were both confirmed correct directly in Postgres.
export async function resolvePostLoginPath(userId: string): Promise<string> {
  const admin = await createAdminClient();

  const { data: profile } = await admin.from("profiles").select("practice_id, role").eq("id", userId).maybeSingle();
  if (profile?.practice_id) {
    // clinic_admin ("Doctor / Admin") and super_admin land on the actual
    // dashboard overview, not the PA-requests list that sits at the bare
    // /dashboard route -- only plain staff (clinic_user) go there.
    const isAdmin = profile.role === "clinic_admin" || profile.role === "super_admin";
    return isAdmin ? "/dashboard/overview" : "/dashboard";
  }

  const { data: patientAccount } = await admin.from("patient_accounts").select("id").eq("id", userId).maybeSingle();
  if (patientAccount) return "/patient";

  // Neither a staff profile nor a patient account exists yet for this
  // user -- first time signing in, needs to pick which one they are.
  return "/auth/choose-role";
}
