import Link from "next/link";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { acceptInviteAction } from "./actions";

export default async function JoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;

  const admin = await createAdminClient();
  const { data: invite } = await admin
    .from("invites")
    .select("practice_id, email, role, title, accepted_at, expires_at")
    .eq("token", token)
    .maybeSingle();

  const invalid = !invite || !!invite.accepted_at || new Date(invite.expires_at) < new Date();

  const { data: practice } = invite && !invalid
    ? await admin.from("practices").select("name").eq("id", invite.practice_id).single()
    : { data: null };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("practice_id").eq("id", user.id).single()
    : { data: null };

  const alreadyThisPractice = !!user && !!invite && profile?.practice_id === invite.practice_id;
  const inOtherPractice = !!user && !!profile?.practice_id && !alreadyThisPractice;

  // Auto-join: a signed-in user with a valid, unused invite and no practice
  // of their own gets attached immediately — no extra click. This is what
  // "join after confirmation, not manually" means in practice: the only
  // manual step left is opening the invite link at all.
  if (user && !invalid && !alreadyThisPractice && !inOtherPractice && !error) {
    const fd = new FormData();
    fd.set("token", token);
    await acceptInviteAction(fd);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
      <div className="card p-8 max-w-[440px] w-full">
        <h1 className="text-[22px] font-semibold mb-1">Join a practice</h1>

        {error && (
          <div className="my-4 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
            {error}
          </div>
        )}

        {invalid ? (
          <p className="text-[14px] text-gray-600 mt-3">
            This invite link is invalid, expired, or already used. Ask your practice admin to send a new one from
            their Team page.
          </p>
        ) : alreadyThisPractice ? (
          <p className="text-[14px] text-gray-600 mt-3">
            You&apos;re already a member of <strong>{practice?.name}</strong>.{" "}
            <Link href="/dashboard" className="text-indigo-600 font-medium">Go to your dashboard →</Link>
          </p>
        ) : inOtherPractice ? (
          <p className="text-[14px] text-gray-600 mt-3">
            This account already belongs to a different practice, so it can&apos;t accept this invite. Sign out and
            create a separate account for <strong>{practice?.name}</strong>, or ask your admin.
          </p>
        ) : user ? (
          <p className="text-[14px] text-gray-600 mt-3">Joining {practice?.name}…</p>
        ) : (
          <>
            <p className="text-[14px] text-gray-600 mt-3 mb-6">
              You&apos;ve been invited to join <strong>{practice?.name}</strong>
              {invite!.title ? ` as ${invite!.title}` : ""}. Create an account (or sign in) with{" "}
              <strong>{invite!.email}</strong> and you&apos;ll be added automatically — no separate setup step.
            </p>
            <div className="flex flex-col gap-2">
              <Link href={`/sign-up?invite=${token}`} className="btn btn-primary w-full justify-center">Create an account</Link>
              <Link href={`/sign-in?next=${encodeURIComponent(`/join/${token}`)}`} className="btn btn-outline w-full justify-center">
                I already have one — sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
