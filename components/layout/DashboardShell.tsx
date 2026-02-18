"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { getCurrentUserProfile } from "../../services/auth/auth.service";
import type { Role, UserProfile } from "../../types";

type DashboardShellProps = {
  children: ReactNode;
};

const roleRouteAccess: Array<{ prefix: string; roles: Role[] }> = [
  { prefix: "/dashboard/configuracion", roles: ["superadmin", "admin"] },
  { prefix: "/dashboard/campanas", roles: ["superadmin", "admin"] },
  { prefix: "/dashboard", roles: ["superadmin", "admin", "agente"] },
];

export default function DashboardShell({ children }: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const loadProfile = async () => {
      setLoadingProfile(true);
      const currentProfile = await getCurrentUserProfile();
      if (!currentProfile) {
        router.replace("/login");
        return;
      }

      setProfile(currentProfile);
      setLoadingProfile(false);
    };

    loadProfile();
  }, [router]);

  const hasAccess = useMemo(() => {
    if (!profile) {
      return false;
    }

    const rule = roleRouteAccess.find((entry) => pathname.startsWith(entry.prefix));
    if (!rule) {
      return true;
    }

    return rule.roles.includes(profile.role);
  }, [pathname, profile]);

  if (loadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-botanical-50 text-sm text-botanical-700">
        Cargando sesión...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-botanical-50">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        role={profile?.role ?? "agente"}
      />
      <div className="flex flex-1 flex-col">
        <Header onToggleSidebar={() => setIsSidebarOpen((value) => !value)} profile={profile} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-white p-6 shadow-card">
            {hasAccess ? (
              children
            ) : (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                No tienes permisos para acceder a esta sección.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
