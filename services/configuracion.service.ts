import { createSupabaseBrowserClient } from "../lib/supabase/client";
import type { Country, Role, RoleSummary, SecuritySummary, UserAssignment } from "../types";

type RoleRow = {
  id: string;
  name: string;
};

type CountryRow = {
  id: string;
  name: string;
  code: string;
};

type AssignmentRow = {
  id: string;
  email: string | null;
  role: string;
  country_id: string | null;
  created_at: string;
  countries?: CountryRow | CountryRow[] | null;
};

const roleCatalog: Record<Role, { description: string; permissions: string[] }> = {
  superadmin: {
    description: "Control global del sistema y configuraciones generales.",
    permissions: ["Todos los países", "Gestión de usuarios", "Auditoría"],
  },
  admin: {
    description: "Gestión operativa del país asignado.",
    permissions: ["Leads del país", "Campañas locales", "Métricas"],
  },
  agente: {
    description: "Operación diaria sobre leads asignados.",
    permissions: ["Leads asignados", "Tareas", "Mensajes manuales"],
  },
};

const toRole = (value: string): Role => {
  if (value === "superadmin" || value === "admin" || value === "agente") {
    return value;
  }
  return "agente";
};

const resolveCountry = (country: AssignmentRow["countries"]) => {
  if (!country) {
    return { countryName: null, countryCode: null };
  }
  if (Array.isArray(country)) {
    return {
      countryName: country[0]?.name ?? null,
      countryCode: country[0]?.code ?? null,
    };
  }
  return {
    countryName: country.name,
    countryCode: country.code,
  };
};

export const listRoles = async (): Promise<RoleSummary[]> => {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.from("roles").select("id, name").order("name", {
    ascending: true,
  });

  if (error || !data) {
    console.error("[config] listRoles error", error);
    return Object.entries(roleCatalog).map(([name, catalog], index) => ({
      id: `fallback-role-${index + 1}`,
      name: name as Role,
      description: catalog.description,
      permissions: catalog.permissions,
    }));
  }

  return (data as RoleRow[]).map((row) => {
    const role = toRole(row.name);
    return {
      id: row.id,
      name: role,
      description: roleCatalog[role].description,
      permissions: roleCatalog[role].permissions,
    };
  });
};

export const listCountries = async (): Promise<Country[]> => {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("countries")
    .select("id, name, code")
    .order("name", { ascending: true });

  if (error || !data) {
    console.error("[config] listCountries error", error);
    return [];
  }

  return data as Country[];
};

export const listUserAssignments = async (): Promise<UserAssignment[]> => {
  const supabase = createSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role, country_id, created_at, countries(id, name, code)")
    .order("created_at", { ascending: true });

  if (error || !data) {
    console.error("[config] listUserAssignments error", error);
    return [];
  }

  return (data as AssignmentRow[]).map((row) => {
    const countryInfo = resolveCountry(row.countries);
    return {
      id: row.id,
      email: row.email,
      role: toRole(row.role),
      countryId: row.country_id,
      countryName: countryInfo.countryName,
      countryCode: countryInfo.countryCode,
      createdAt: row.created_at,
    };
  });
};

export const updateUserAssignment = async (
  userId: string,
  role: Role,
  countryId: string | null
): Promise<void> => {
  const supabase = createSupabaseBrowserClient();

  const { error } = await supabase
    .from("profiles")
    .update({ role, country_id: countryId })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }
};

export const getSecuritySummary = async (): Promise<SecuritySummary> => {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[config] getSecuritySummary error", error);
  }

  return {
    lastAuditAt: data?.created_at ?? new Date().toISOString(),
    notes: [
      "RLS pendiente de activación final (fase de hardening).",
      "Asignación por país activa desde Configuración.",
    ],
  };
};
