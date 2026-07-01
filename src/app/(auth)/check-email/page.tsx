export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; reset?: string }>;
}) {
  const { email, reset } = await searchParams;

  return (
    <div className="text-center">
      <h1 className="text-[22px] font-semibold mb-2">Check your inbox</h1>
      <p className="text-[14px] text-gray-600">
        {reset
          ? "If an account exists for"
          : "We sent a verification link to"}{" "}
        <span className="font-medium text-gray-900">{email}</span>.{" "}
        {reset ? "you'll get a password reset link shortly." : "Click it to activate your account."}
      </p>
    </div>
  );
}
