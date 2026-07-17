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
  if (!profile?.practice_id) {
    // Password sign-up already forces an explicit physician/staff-vs-patient
    // choice (two separate forms at /sign-up), so a "staff" profile with no
    // practice yet just means onboarding isn't finished -- expected. OAuth
    // sign-in has no such form: Supabase's own new-user trigger defaults
    // every account_type-less signup to "staff", so a Google/Microsoft
    // sign-in with no practice AND no prior choice is genuinely ambiguous
    // and needs to ask, rather than silently assuming staff.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const provider = user?.app_metadata?.provider;
    if (provider && provider !== "email") return "/auth/choose-role";
    return "/onboarding";
  }

  // clinic_admin ("Doctor / Admin") and super_admin land on the actual
  // dashboard overview, not the PA-requests list that sits at the bare
  // /dashboard route -- only plain staff (clinic_user) go there.
  const isAdmin = profile.role === "clinic_admin" || profile.role === "super_admin";
  return isAdmin ? "/dashboard/overview" : "/dashboard";
}
