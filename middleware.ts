import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminEmail } from "@/lib/isAdmin";

// Vercel убивает Edge-функцию через ~25с. Если Supabase Auth подвисает,
// без этого таймаута middleware съедает весь бюджет сам и весь сайт отдаёт 504
// на каждом маршруте — вместо этого после AUTH_TIMEOUT_MS считаем сессию неизвестной.
const AUTH_TIMEOUT_MS = 8000;

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options });
        }
      }
    }
  );

  const isAppRoute =
    request.nextUrl.pathname.startsWith("/today") ||
    request.nextUrl.pathname.startsWith("/plan") ||
    request.nextUrl.pathname.startsWith("/cart") ||
    request.nextUrl.pathname.startsWith("/coach") ||
    request.nextUrl.pathname.startsWith("/profile") ||
    request.nextUrl.pathname.startsWith("/onboarding") ||
    request.nextUrl.pathname.startsWith("/admin");

  let user = null;
  try {
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("auth timeout")), AUTH_TIMEOUT_MS);
    });
    const result = await Promise.race([supabase.auth.getUser(), timeout]);
    user = result.data.user;
  } catch {
    if (isAppRoute) return NextResponse.redirect(new URL("/login", request.url));
    return response;
  }

  if (isAppRoute && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (request.nextUrl.pathname.startsWith("/admin") && !isAdminEmail(user?.email)) {
    return NextResponse.redirect(new URL("/today", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
