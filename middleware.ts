import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { APP_ROUTES } from "./lib/constants";
import { isProtectedRoute } from "./lib/auth";

export async function middleware(request: NextRequest) {
	const response = NextResponse.next();

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
		{
			cookies: {
				get: (name) => request.cookies.get(name)?.value,
				set: (name, value, options) => {
					response.cookies.set({ name, value, ...options });
				},
				remove: (name, options) => {
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
		// TODO: Redireccionar según rol cuando se implemente lectura de perfil.
		return NextResponse.redirect(new URL(APP_ROUTES.dashboard, request.url));
	}

	if (isProtectedRoute(pathname) && !user) {
		return NextResponse.redirect(new URL(APP_ROUTES.login, request.url));
	}

	return response;
}

export const config = {
	matcher: ["/dashboard/:path*", "/login"],
};
