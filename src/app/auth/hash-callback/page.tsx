"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function HashCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const next = searchParams.get("next") || "/dashboard";
    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
    const hashParams = new URLSearchParams(hash);

    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    const hashError = hashParams.get("error_description") || hashParams.get("error");

    // Reading window.location.hash — a one-time snapshot of an external
    // (browser) API taken on mount, not state derived from React itself —
    // so setting it synchronously here is the correct use of this effect.
    if (hashError) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(decodeURIComponent(hashError.replace(/\+/g, " ")));
      return;
    }

    if (!accessToken || !refreshToken) {
      setError("That link is invalid, expired, or was opened in a different browser than the one it was sent to. Try signing in directly, or ask for a new link.");
      return;
    }

    const supabase = createClient();
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error: sessionError }) => {
      if (sessionError) {
        setError(sessionError.message);
        return;
      }
      router.replace(next);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="card p-8 max-w-[440px] w-full text-center">
      {error ? (
        <>
          <h1 className="text-[18px] font-semibold mb-2">Couldn&apos;t sign you in</h1>
          <p className="text-[14px] text-gray-600 mb-4">{error}</p>
          <a href="/sign-in" className="btn btn-primary">Go to sign in</a>
        </>
      ) : (
        <p className="text-[14px] text-gray-600">Signing you in…</p>
      )}
    </div>
  );
}

export default function HashCallbackPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
      <Suspense fallback={<div className="card p-8 max-w-[440px] w-full text-center text-[14px] text-gray-600">Signing you in…</div>}>
        <HashCallbackInner />
      </Suspense>
    </div>
  );
}
