import type { Country, RoleSummary, SecuritySummary } from "../types";

const mockCountries: Country[] = [
  { id: "co", name: "Colombia", code: "CO" },
  { id: "mx", name: "México", code: "MX" },
  { id: "cl", name: "Chile", code: "CL" },
  { id: "pe", name: "Perú", code: "PE" },
];

const mockRoles: RoleSummary[] = [
  {
    id: "role-1",
    name: "superadmin",
    description: "Control global del sistema y configuraciones generales.",
    permissions: ["Todos los países", "Gestión de usuarios", "Auditoría"],
  },
  {
    id: "role-2",
    name: "admin",
    description: "Gestión operativa del país asignado.",
    permissions: ["Leads del país", "Campañas locales", "Métricas"],
  },
  {
    id: "role-3",
    name: "agente",
    description: "Operación diaria sobre leads asignados.",
    permissions: ["Leads asignados", "Tareas", "Mensajes manuales"],
  },
];

const mockSecurity: SecuritySummary = {
  lastAuditAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  notes: [
    "RLS pendiente de implementación final.",
    "Se revisaron permisos básicos por rol.",
  ],
};

export const listRoles = async (): Promise<RoleSummary[]> => {
  return [...mockRoles];
};

export const listCountries = async (): Promise<Country[]> => {
  return [...mockCountries];
};

export const getSecuritySummary = async (): Promise<SecuritySummary> => {
  return { ...mockSecurity };
};
