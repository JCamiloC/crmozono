import Link from "next/link";
import type { Role } from "../../types";

const navigation = [
  { label: "Dashboard", href: "/dashboard", roles: ["superadmin", "admin", "agente"] as Role[] },
  { label: "Leads", href: "/dashboard/leads", roles: ["superadmin", "admin", "agente"] as Role[] },
  { label: "Tareas", href: "/dashboard/tareas", roles: ["superadmin", "admin", "agente"] as Role[] },
  { label: "Llamadas", href: "/dashboard/llamadas", roles: ["superadmin", "admin", "agente"] as Role[] },
  { label: "Mensajes", href: "/dashboard/mensajes", roles: ["superadmin", "admin", "agente"] as Role[] },
  { label: "Campañas", href: "/dashboard/campanas", roles: ["superadmin", "admin"] as Role[] },
  { label: "Configuración", href: "/dashboard/configuracion", roles: ["superadmin", "admin"] as Role[] },
];

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  role: Role;
};

export default function Sidebar({ isOpen, onClose, role }: SidebarProps) {
  const allowedNavigation = navigation.filter((item) => item.roles.includes(role));

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/20 transition-opacity lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-botanical-100 bg-white px-6 py-8 shadow-soft transition-transform lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-botanical-600 text-sm font-semibold text-white">
            SO
          </div>
          <div>
            <p className="text-sm font-semibold text-botanical-900">SuperOzono</p>
            <p className="text-xs text-botanical-600">CRM de ventas</p>
          </div>
        </div>
        <nav className="flex flex-col gap-2">
          {allowedNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl px-3 py-2 text-sm font-medium text-botanical-800 transition hover:bg-botanical-50 hover:text-botanical-900"
              onClick={onClose}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-10 rounded-2xl border border-botanical-100 bg-botanical-50 p-4 text-xs text-botanical-700">
          <p className="font-semibold text-botanical-900">Estado</p>
          <p className="mt-2">Multi-país activo</p>
        </div>
      </aside>
    </>
  );
}
