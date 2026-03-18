import type { Role } from "../types";
import { APP_ROUTES } from "./constants";

export const getDefaultRouteForRole = (role: Role): string => {
	switch (role) {
		case "superadmin":
			return APP_ROUTES.dashboard;
		case "admin":
			return APP_ROUTES.dashboard;
		case "agente":
			return APP_ROUTES.leads;
		default:
			return APP_ROUTES.dashboard;
	}
};

export const isProtectedRoute = (pathname: string): boolean => {
	return pathname.startsWith("/dashboard");
};
