import Link from "next/link";
import { signUpAction } from "../actions";
import PatientSignUpForm from "./PatientSignUpForm";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; invite?: string; type?: string }>;
}) {
  const { error, invite, type } = await searchParams;
  const isPatient = type === "patient";

  return (
    <>
      <h1 className="text-[22px] font-semibold mb-1">{invite ? "Create your account" : "Start your free pilot"}</h1>
      <p className="text-[14px] text-gray-600 mb-4">
        {invite ? "You'll be added to your practice's workspace automatically once you confirm your email." : "10 free letters, no card required."}
      </p>

      {!invite && (
        <div className="flex rounded-lg border border-gray-200 p-1 mb-6 text-[13.5px] font-medium">
          <Link
            href="/sign-up"
            className={`flex-1 text-center rounded-md py-1.5 ${!isPatient ? "bg-indigo-600 text-white" : "text-gray-600"}`}
          >
            Physician / Staff
          </Link>
          <Link
            href="/sign-up?type=patient"
            className={`flex-1 text-center rounded-md py-1.5 ${isPatient ? "bg-indigo-600 text-white" : "text-gray-600"}`}
          >
            Patient
          </Link>
        </div>
      )}

      {error && (
        <div className="mb-4 text-[13px] rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger-red)" }}>
          {error}
        </div>
      )}

      {isPatient && !invite ? (
        <PatientSignUpForm />
      ) : (
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
      )}

      <p className="text-[13.5px] text-gray-600 mt-6 text-center">
        Already have an account? <Link href="/sign-in" className="text-indigo-600 font-medium">Sign in</Link>
      </p>
    </>
  );
}
