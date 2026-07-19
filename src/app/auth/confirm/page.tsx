import { confirmInviteLinkAction } from "./actions";

// This page exists so the actual sign-in only happens on an explicit click,
// never on page load. The old approach linked straight to Supabase's own
// hosted verify endpoint (or auto-verified on GET here) — a one-time-use
// token that a link-preview crawler (WhatsApp, Telegram, corporate email
// "Safe Links" scanners) silently burns just by fetching the URL to build a
// preview, so the real recipient then hits "invalid or expired" on a link
// they never actually clicked yet. A crawler loads this page but doesn't
// submit forms, so the token survives until a human clicks the button.
export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string; next?: string }>;
}) {
  const { token_hash, type, next } = await searchParams;

  if (!token_hash || !type) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
        <div className="card p-8 max-w-[440px] w-full text-center">
          <h1 className="text-[18px] font-semibold mb-2">Couldn&apos;t sign you in</h1>
          <p className="text-[14px] text-gray-600 mb-4">This link is missing required information. Ask for a new one.</p>
          <a href="/sign-in" className="btn btn-primary">Go to sign in</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
      <div className="card p-8 max-w-[440px] w-full text-center">
        <h1 className="text-[18px] font-semibold mb-2">You&apos;re invited</h1>
        <p className="text-[14px] text-gray-600 mb-6">Click below to sign in and continue.</p>
        <form action={confirmInviteLinkAction}>
          <input type="hidden" name="token_hash" value={token_hash} />
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="next" value={next || "/doctor/dashboard"} />
          <button type="submit" className="btn btn-primary w-full justify-center">Continue →</button>
        </form>
      </div>
    </div>
  );
}
