import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { APP_ROUTES } from "./lib/constants";
import { getDefaultRouteForRole, isProtectedRoute } from "./lib/auth";
import type { Role } from "./types";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        get: (name: string) => request.cookies.get(name)?.value,
        set: (name: string, value: string, options: Record<string, unknown>) => {
          response.cookies.set({ name, value, ...options });
        },
        remove: (name: string, options: Record<string, unknown>) => {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (pathname === APP_ROUTES.login && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const safeRole: Role =
      profile?.role === "superadmin" || profile?.role === "admin" || profile?.role === "agente"
        ? profile.role
        : "agente";

    return NextResponse.redirect(new URL(getDefaultRouteForRole(safeRole), request.url));
  }

  if (isProtectedRoute(pathname) && !user) {
    return NextResponse.redirect(new URL(APP_ROUTES.login, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
