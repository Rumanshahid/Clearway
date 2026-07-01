import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="py-6 text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-[19px] font-semibold text-gray-900">
          <span className="w-[26px] h-[26px] rounded-[7px] bg-navy-900 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M7 2l5 5-5 5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          Clearway
        </Link>
      </div>
      <div className="flex-1 flex items-start justify-center px-5 pb-16">
        <div className="card w-full max-w-[420px] p-8 mt-4">{children}</div>
      </div>
    </div>
  );
}
