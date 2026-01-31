import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const createSupabaseServerClient = () => {
	const cookieStore = cookies();
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

	return createServerClient(supabaseUrl, supabaseAnonKey, {
		cookies: {
			get: (name) => cookieStore.get(name)?.value,
			set: (name, value, options) => {
				cookieStore.set({ name, value, ...options });
			},
			remove: (name, options) => {
				cookieStore.set({ name, value: "", ...options });
			},
		},
	});
};
