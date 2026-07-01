import Link from "next/link";
import { forgotPasswordAction } from "../actions";

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-[22px] font-semibold mb-1">Reset your password</h1>
      <p className="text-[14px] text-gray-600 mb-6">We&apos;ll email you a reset link.</p>

      <form action={forgotPasswordAction} className="flex flex-col gap-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input className="input" id="email" name="email" type="email" required />
        </div>
        <button className="btn btn-primary w-full justify-center mt-2" type="submit">
          Send reset link →
        </button>
      </form>

      <p className="text-[13.5px] text-gray-600 mt-6 text-center">
        <Link href="/sign-in" className="text-indigo-600 font-medium">Back to sign in</Link>
      </p>
    </>
  );
}
