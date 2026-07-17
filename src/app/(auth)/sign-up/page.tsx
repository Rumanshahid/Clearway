import Link from "next/link";
import { signUpAction, signInWithOAuthAction } from "../actions";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; invite?: string }>;
}) {
  const { error, invite } = await searchParams;

  return (
    <>
      <h1 className="text-[22px] font-semibold mb-1">{invite ? "Create your account" : "Start your free pilot"}</h1>
      <p className="text-[14px] text-gray-600 mb-4">
        {invite ? "You'll be added to your practice's workspace automatically once you confirm your email." : "10 free letters, no card required."}
      </p>

      {error && (
        <div className="mb-4 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
          {error}
        </div>
      )}

      {!invite && (
        <>
          <div className="mb-5">
            <form action={signInWithOAuthAction}>
              <input type="hidden" name="provider" value="google" />
              <button type="submit" className="btn btn-outline w-full justify-center gap-2.5">
                <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden="true">
                  <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62Z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18Z" />
                  <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33Z" />
                  <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58Z" />
                </svg>
                Continue with Google
              </button>
            </form>
          </div>
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: "var(--gray-200)" }} />
            <span className="text-[12px] text-gray-400">or continue with email</span>
            <div className="flex-1 h-px" style={{ background: "var(--gray-200)" }} />
          </div>
        </>
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
