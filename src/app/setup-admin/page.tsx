import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { bootstrapAdminAction } from "./actions";

export default async function SetupAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  return (
    <div className="max-w-[420px] mx-auto py-16 px-5">
      <h1 className="text-[22px] font-semibold mb-1">Set up admin access</h1>
      <p className="text-[14px] text-gray-600 mb-6">
        One-time step to make this signed-in account a super admin. Only works while no admin exists yet, and
        requires the setup key configured in the server&apos;s environment variables.
      </p>

      {profile?.role === "super_admin" ? (
        <p className="text-[13.5px] text-gray-600">
          This account is already a super admin — go to <a href="/admin" className="text-indigo-600 font-medium">/admin</a>.
        </p>
      ) : (
        <form action={bootstrapAdminAction} className="flex flex-col gap-4">
          {error && (
            <div className="text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
              {error}
            </div>
          )}
          <div>
            <label className="label" htmlFor="secret">Setup key</label>
            <input className="input" id="secret" name="secret" type="password" required />
          </div>
          <button className="btn btn-primary w-full justify-center" type="submit">
            Become super admin →
          </button>
        </form>
      )}
    </div>
  );
}
