import type { Task, TaskHistory, TaskStatus } from "../../types";

// TODO: Reemplazar mock por Supabase cuando se habilite backend real.
const mockTasks: Task[] = [
  {
    id: "task-001",
    leadId: "lead-001",
    leadNombre: "María Torres",
    agenteId: "agente-co-01",
    titulo: "Llamar nuevamente",
    tipoTarea: "Llamar nuevamente",
    descripcion: "Cliente no respondió en el primer contacto.",
    fechaProgramada: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
    estado: "pendiente",
    fechaCreacion: new Date().toISOString(),
    fechaCompletada: null,
  },
  {
    id: "task-002",
    leadId: "lead-002",
    leadNombre: "José Martínez",
    agenteId: "agente-mx-03",
    titulo: "Enviar seguimiento",
    tipoTarea: "Enviar mensaje de seguimiento",
    descripcion: "Enviar propuesta comercial por WhatsApp (simulado).",
    fechaProgramada: new Date(Date.now() + 1000 * 60 * 60 * 26).toISOString(),
    estado: "pendiente",
    fechaCreacion: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    fechaCompletada: null,
  },
  {
    id: "task-003",
    leadId: "lead-003",
    leadNombre: "Carolina Ríos",
    agenteId: "agente-cl-02",
    titulo: "Esperar respuesta",
    tipoTarea: "Esperar respuesta del cliente",
    descripcion: null,
    fechaProgramada: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    estado: "vencida",
    fechaCreacion: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    fechaCompletada: null,
  },
  {
    id: "task-004",
    leadId: "lead-004",
    leadNombre: "Daniel Herrera",
    agenteId: "agente-pe-05",
    titulo: "Confirmar datos",
    tipoTarea: "Tarea personalizada",
    descripcion: "Verificar dirección de entrega.",
    fechaProgramada: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    estado: "completada",
    fechaCreacion: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
    fechaCompletada: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
];

let autoTasksSeeded = false;

const mockHistory: TaskHistory[] = mockTasks.map((task, index) => ({
  id: `task-history-${index + 1}`,
  taskId: task.id,
  estado: task.estado,
  fecha: task.fechaCreacion,
  usuarioId: task.agenteId,
  comentario: "Registro inicial",
}));

export const listTasks = async (): Promise<Task[]> => {
  if (!autoTasksSeeded) {
    mockTasks.push({
      id: "task-auto-001",
      leadId: "lead-002",
      leadNombre: "José Martínez",
      agenteId: "agente-mx-03",
      titulo: "Seguimiento por inactividad",
      tipoTarea: "Auto seguimiento",
      descripcion: "Tarea generada por inactividad simulada.",
      fechaProgramada: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(),
      estado: "pendiente",
      fechaCreacion: new Date().toISOString(),
      fechaCompletada: null,
    });
    autoTasksSeeded = true;
  }
  return [...mockTasks];
};

export const getTaskById = async (taskId: string): Promise<Task | null> => {
  return mockTasks.find((task) => task.id === taskId) ?? null;
};

export const createTask = async (payload: Omit<Task, "id" | "fechaCreacion" | "fechaCompletada">) => {
  const newTask: Task = {
    ...payload,
    id: `task-${Math.random().toString(36).slice(2, 7)}`,
    fechaCreacion: new Date().toISOString(),
    fechaCompletada: null,
  };
  mockTasks.push(newTask);
  mockHistory.push({
    id: `task-history-${mockHistory.length + 1}`,
    taskId: newTask.id,
    estado: newTask.estado,
    fecha: newTask.fechaCreacion,
    usuarioId: newTask.agenteId,
    comentario: "Tarea creada",
  });
  return newTask;
};

export const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
  const task = mockTasks.find((item) => item.id === taskId);
  if (!task) {
    throw new Error("Tarea no encontrada");
  }
  task.estado = status;
  task.fechaCompletada = status === "completada" ? new Date().toISOString() : null;
  mockHistory.push({
    id: `task-history-${mockHistory.length + 1}`,
    taskId,
    estado: status,
    fecha: new Date().toISOString(),
    usuarioId: task.agenteId,
    comentario: `Estado actualizado a ${status}`,
  });
  return task;
};

export const cancelTasksByLead = async (leadId: string) => {
  const updatedTasks: Task[] = [];
  mockTasks.forEach((task) => {
    if (task.leadId === leadId && task.estado === "pendiente") {
      task.estado = "cancelada";
      updatedTasks.push(task);
      mockHistory.push({
        id: `task-history-${mockHistory.length + 1}`,
        taskId: task.id,
        estado: "cancelada",
        fecha: new Date().toISOString(),
        usuarioId: task.agenteId,
        comentario: "Cancelada por cierre de lead",
      });
    }
  });
  return updatedTasks;
};

export const getTaskHistory = async (taskId: string): Promise<TaskHistory[]> => {
  return mockHistory.filter((item) => item.taskId === taskId);
};
