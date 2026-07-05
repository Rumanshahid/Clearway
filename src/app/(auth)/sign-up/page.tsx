import Link from "next/link";
import { signUpAction } from "../actions";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; invite?: string }>;
}) {
  const { error, invite } = await searchParams;

  return (
    <>
      <h1 className="text-[22px] font-semibold mb-1">{invite ? "Create your account" : "Start your free pilot"}</h1>
      <p className="text-[14px] text-gray-600 mb-6">
        {invite ? "You'll be added to your practice's workspace automatically once you confirm your email." : "10 free letters, no card required."}
      </p>

      {error && (
        <div className="mb-4 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
          {error}
        </div>
      )}

      <form action={signUpAction} className="flex flex-col gap-4">
        {invite && <input type="hidden" name="invite" value={invite} />}
        <div>
          <label className="label" htmlFor="full_name">Full name</label>
          <input className="input" id="full_name" name="full_name" required />
        </div>
        <div>
          <label className="label" htmlFor="email">Work email</label>
          <input className="input" id="email" name="email" type="email" required />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input className="input" id="password" name="password" type="password" minLength={8} required />
        </div>
        <button className="btn btn-primary w-full justify-center mt-2" type="submit">
          Create account →
        </button>
      </form>

      <p className="text-[13.5px] text-gray-600 mt-6 text-center">
        Already have an account? <Link href="/sign-in" className="text-indigo-600 font-medium">Sign in</Link>
      </p>
    </>
  );
}
