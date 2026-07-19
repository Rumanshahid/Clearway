import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { resolvePostLoginPath } from "@/lib/auth-redirect";

const PROTECTED_PREFIXES = ["/dashboard", "/doctor/dashboard", "/onboarding", "/admin", "/patient"];
const AUTH_PAGES = ["/sign-in", "/sign-up", "/forgot-password"];

/**
 * Refreshes the Supabase auth cookie on every matched request -- the only
 * place that can actually persist a refreshed session, since Server
 * Components can't reliably set cookies during rendering (see the
 * try/catch in lib/supabase/server.ts). Without this running, a Server
 * Component calling auth.getUser() on a near-expired session triggers a
 * refresh whose new token silently never reaches the browser while the old
 * refresh token it replaced is invalidated server-side, signing the user
 * out for no visible reason.
 *
 * This file previously existed as src/proxy.ts exporting a `proxy`
 * function, which Next.js never actually invokes -- only a file literally
 * named middleware.ts exporting `middleware` is wired into the request
 * pipeline. That meant none of this logic, including the route-protection
 * redirects below, ever ran.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        maxAge: 60 * 60 * 24 * 365, // 1 year — explicit so session survives tab/browser close
        sameSite: "lax",
        secure: true,
        path: "/",
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = await resolvePostLoginPath(user.id);
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
