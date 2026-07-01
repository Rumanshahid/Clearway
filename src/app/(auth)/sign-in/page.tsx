import Link from "next/link";
import { signInAction } from "../actions";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <>
      <h1 className="text-[22px] font-semibold mb-1">Sign in</h1>
      <p className="text-[14px] text-gray-600 mb-6">Welcome back.</p>

      {error && (
        <div className="mb-4 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
          {error}
        </div>
      )}

      <form action={signInAction} className="flex flex-col gap-4">
        {next && <input type="hidden" name="next" value={next} />}
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input className="input" id="email" name="email" type="email" required />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="password">Password</label>
            <Link href="/forgot-password" className="text-[12.5px] text-indigo-600 mb-2">Forgot password?</Link>
          </div>
          <input className="input" id="password" name="password" type="password" required />
        </div>
        <button className="btn btn-primary w-full justify-center mt-2" type="submit">
          Sign in →
        </button>
      </form>

      <p className="text-[13.5px] text-gray-600 mt-6 text-center">
        No account yet? <Link href="/sign-up" className="text-indigo-600 font-medium">Start a free pilot</Link>
      </p>
    </>
  );
}
