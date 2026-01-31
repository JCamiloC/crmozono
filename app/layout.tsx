import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
	title: "SuperOzono CRM",
	description: "CRM de ventas multi-país con WhatsApp Business API",
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="es">
			<body className="min-h-screen bg-white text-slate-900">
				{children}
			</body>
		</html>
	);
}
