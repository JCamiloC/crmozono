import Link from "next/link";
import Image from "next/image";
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
        className={`fixed inset-y-0 left-0 z-50 w-[86vw] max-w-72 border-r border-botanical-100 bg-white px-4 py-6 shadow-soft transition-transform sm:px-6 sm:py-8 lg:static lg:w-72 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center gap-3">
          <div className="relative h-11 w-11 overflow-hidden rounded-2xl border border-botanical-100 bg-white">
            <Image
              src="/SuperOzono.png"
              alt="Logo SuperOzono"
              fill
              sizes="44px"
              className="object-contain p-1"
              priority
            />
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
