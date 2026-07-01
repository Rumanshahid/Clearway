import { resetPasswordAction } from "../actions";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <>
      <h1 className="text-[22px] font-semibold mb-1">Set a new password</h1>
      <p className="text-[14px] text-gray-600 mb-6">Choose something you haven&apos;t used before.</p>

      {error && (
        <div className="mb-4 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
          {error}
        </div>
      )}

      <form action={resetPasswordAction} className="flex flex-col gap-4">
        <div>
          <label className="label" htmlFor="password">New password</label>
          <input className="input" id="password" name="password" type="password" minLength={8} required />
        </div>
        <button className="btn btn-primary w-full justify-center mt-2" type="submit">
          Update password →
        </button>
      </form>
    </>
  );
}
