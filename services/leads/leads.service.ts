import type { Lead, LeadStatus, LeadStatusHistory } from "../../types";

// TODO: Reemplazar mock por Supabase cuando se habilite backend real.
const SLA_DAYS = 5;
const mockLeads: Lead[] = [
  {
    id: "lead-001",
    nombre: "María Torres",
    telefono: "+57 300 123 4567",
    pais: "Colombia",
    administradorId: "admin-co",
    agenteId: "agente-co-01",
    estadoActual: "nuevo",
    fechaEstado: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "lead-002",
    nombre: "José Martínez",
    telefono: "+52 55 2345 6789",
    pais: "México",
    administradorId: "admin-mx",
    agenteId: "agente-mx-03",
    estadoActual: "seguimiento",
    fechaEstado: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "lead-003",
    nombre: "Carolina Ríos",
    telefono: "+56 9 8123 4567",
    pais: "Chile",
    administradorId: "admin-cl",
    agenteId: "agente-cl-02",
    estadoActual: "contactado",
    fechaEstado: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "lead-004",
    nombre: "Daniel Herrera",
    telefono: "+51 999 888 777",
    pais: "Perú",
    administradorId: "admin-pe",
    agenteId: "agente-pe-05",
    estadoActual: "llamada",
    fechaEstado: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "lead-005",
    nombre: "Sofía López",
    telefono: "+54 11 5678 9012",
    pais: "Argentina",
    administradorId: "admin-ar",
    agenteId: "agente-ar-01",
    estadoActual: "venta",
    fechaEstado: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockHistory: LeadStatusHistory[] = mockLeads.map((lead, index) => ({
  id: `history-${index + 1}`,
  leadId: lead.id,
  estado: lead.estadoActual,
  fecha: lead.fechaEstado,
  usuarioId: lead.agenteId,
}));

export const listLeads = async (): Promise<Lead[]> => {
  const now = Date.now();
  mockLeads.forEach((lead) => {
    const createdAtMs = new Date(lead.createdAt).getTime();
    const ageDays = (now - createdAtMs) / (1000 * 60 * 60 * 24);
    if (ageDays > SLA_DAYS && lead.estadoActual !== "venta" && lead.estadoActual !== "cerrado_tiempo") {
      lead.estadoActual = "cerrado_tiempo";
      lead.fechaEstado = new Date().toISOString();
      lead.updatedAt = new Date().toISOString();
      mockHistory.push({
        id: `history-${mockHistory.length + 1}`,
        leadId: lead.id,
        estado: "cerrado_tiempo",
        fecha: lead.fechaEstado,
        usuarioId: "sistema",
      });
    }
  });
  return [...mockLeads];
};

export const getLeadById = async (leadId: string): Promise<Lead | null> => {
  return mockLeads.find((lead) => lead.id === leadId) ?? null;
};

export const createLead = async (payload: Omit<Lead, "id" | "createdAt" | "updatedAt">) => {
  const newLead: Lead = {
    ...payload,
    id: `lead-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockLeads.push(newLead);
  return newLead;
};

export const updateLeadStatus = async (leadId: string, status: LeadStatus) => {
  const lead = mockLeads.find((item) => item.id === leadId);
  if (!lead) {
    throw new Error("Lead no encontrado");
  }
  lead.estadoActual = status;
  lead.fechaEstado = new Date().toISOString();
  lead.updatedAt = new Date().toISOString();
  mockHistory.push({
    id: `history-${mockHistory.length + 1}`,
    leadId,
    estado: status,
    fecha: lead.fechaEstado,
    usuarioId: lead.agenteId,
  });
  return lead;
};

export const closeLead = async (leadId: string) => {
  return updateLeadStatus(leadId, "venta");
};

export const assignLead = async (leadId: string, agenteId: string) => {
  const lead = mockLeads.find((item) => item.id === leadId);
  if (!lead) {
    throw new Error("Lead no encontrado");
  }
  lead.agenteId = agenteId;
  lead.updatedAt = new Date().toISOString();
  return lead;
};

export const getLeadHistory = async (leadId: string): Promise<LeadStatusHistory[]> => {
  return mockHistory.filter((item) => item.leadId === leadId);
};
