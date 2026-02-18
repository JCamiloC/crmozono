"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "../../services/auth/auth.service";
import type { UserProfile } from "../../types";

type HeaderProps = {
  onToggleSidebar: () => void;
  profile: UserProfile | null;
};

export default function Header({ onToggleSidebar, profile }: HeaderProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const userLabel = profile?.email ?? "Usuario autenticado";
  const initials = (() => {
    if (!profile?.email) {
      return "US";
    }
    const base = profile.email.split("@")[0] ?? "us";
    return base.slice(0, 2).toUpperCase();
  })();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-botanical-100 bg-white/90 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex items-center justify-center rounded-lg border border-botanical-200 bg-botanical-50 px-3 py-2 text-xs font-semibold text-botanical-700 shadow-sm transition hover:bg-botanical-100 lg:hidden"
        >
          Menú
        </button>
        <div>
          <p className="text-sm font-semibold text-botanical-900">
            SuperOzono CRM
          </p>
          <p className="text-xs text-botanical-600">
            CRM de ventas multi-país
          </p>
        </div>
      </div>
      <div className="relative flex items-center gap-3">
        <div className="hidden text-right text-xs text-botanical-700 sm:block">
          <p className="font-semibold text-botanical-900">{profile?.role ?? "usuario"}</p>
          <p className="text-botanical-600">{userLabel}</p>
        </div>
        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-botanical-200 text-xs font-semibold text-botanical-800"
        >
          {initials}
        </button>
        {menuOpen ? (
          <div className="absolute right-0 top-12 z-20 w-40 rounded-xl border border-botanical-100 bg-white p-2 shadow-soft">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-botanical-700 transition hover:bg-botanical-50"
            >
              Cerrar sesión
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
