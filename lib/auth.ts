import type { Role } from "../types";
import { APP_ROUTES } from "./constants";

export const getDefaultRouteForRole = (role: Role): string => {
	switch (role) {
		case "superadmin":
		case "admin":
		case "agente":
		default:
			return APP_ROUTES.dashboard;
	}
};

export const isProtectedRoute = (pathname: string): boolean => {
	return pathname.startsWith("/dashboard");
};
