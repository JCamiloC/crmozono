import { createSupabaseBrowserClient } from "../../lib/supabase/client";
import type { Task, TaskHistory, TaskStatus } from "../../types";

type TaskRow = {
  id: string;
  lead_id: string;
  agente_id: string;
  titulo: string;
  tipo_tarea: string;
  descripcion: string | null;
  fecha_programada: string;
  estado: string;
  fecha_creacion: string;
  fecha_completada: string | null;
  leads?: { nombre: string | null } | { nombre: string | null }[] | null;
};

type TaskHistoryRow = {
  id: string;
  task_id: string;
  estado: string;
  fecha: string;
  usuario_id: string;
  comentario: string | null;
};

const VALID_TASK_STATUS: TaskStatus[] = [
  "pendiente",
  "completada",
  "vencida",
  "cancelada",
];

const normalizeTaskStatus = (value: string): TaskStatus => {
  if (VALID_TASK_STATUS.includes(value as TaskStatus)) {
    return value as TaskStatus;
  }
  return "pendiente";
};

const resolveLeadName = (leads: TaskRow["leads"]): string => {
  if (!leads) {
    return "Lead sin nombre";
  }
  if (Array.isArray(leads)) {
    return leads[0]?.nombre ?? "Lead sin nombre";
  }
  return leads.nombre ?? "Lead sin nombre";
};

const mapTaskRow = (row: TaskRow): Task => {
  return {
    id: row.id,
    leadId: row.lead_id,
    leadNombre: resolveLeadName(row.leads),
    agenteId: row.agente_id,
    titulo: row.titulo,
    tipoTarea: row.tipo_tarea,
    descripcion: row.descripcion,
    fechaProgramada: row.fecha_programada,
    estado: normalizeTaskStatus(row.estado),
    fechaCreacion: row.fecha_creacion,
    fechaCompletada: row.fecha_completada,
  };
};

const mapTaskHistoryRow = (row: TaskHistoryRow): TaskHistory => {
  return {
    id: row.id,
    taskId: row.task_id,
    estado: normalizeTaskStatus(row.estado),
    fecha: row.fecha,
    usuarioId: row.usuario_id,
    comentario: row.comentario,
  };
};

const getCurrentActorId = async (fallbackUserId: string): Promise<string> => {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? fallbackUserId;
};

export const listTasks = async (): Promise<Task[]> => {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(
      "id, lead_id, agente_id, titulo, tipo_tarea, descripcion, fecha_programada, estado, fecha_creacion, fecha_completada, leads(nombre)"
    )
    .order("fecha_programada", { ascending: true });

  if (error || !data) {
    console.error("[tasks] listTasks error", error);
    return [];
  }

  return (data as TaskRow[]).map(mapTaskRow);
};

export const getTaskById = async (taskId: string): Promise<Task | null> => {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(
      "id, lead_id, agente_id, titulo, tipo_tarea, descripcion, fecha_programada, estado, fecha_creacion, fecha_completada, leads(nombre)"
    )
    .eq("id", taskId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapTaskRow(data as TaskRow);
};

export const createTask = async (
  payload: Omit<Task, "id" | "fechaCreacion" | "fechaCompletada">
): Promise<Task> => {
  const supabase = createSupabaseBrowserClient();

  const { data: existingPendingTask } = await supabase
    .from("tasks")
    .select("id")
    .eq("lead_id", payload.leadId)
    .eq("tipo_tarea", payload.tipoTarea)
    .eq("estado", "pendiente")
    .limit(1)
    .maybeSingle();

  if (existingPendingTask) {
    throw new Error("Ya existe una tarea pendiente de este tipo para el lead");
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      lead_id: payload.leadId,
      agente_id: payload.agenteId,
      titulo: payload.titulo,
      tipo_tarea: payload.tipoTarea,
      descripcion: payload.descripcion,
      fecha_programada: payload.fechaProgramada,
      estado: payload.estado,
    })
    .select(
      "id, lead_id, agente_id, titulo, tipo_tarea, descripcion, fecha_programada, estado, fecha_creacion, fecha_completada, leads(nombre)"
    )
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      throw new Error("Ya existe una tarea pendiente de este tipo para el lead");
    }
    throw new Error(error?.message ?? "No se pudo crear la tarea");
  }

  const task = mapTaskRow(data as TaskRow);
  const actorId = await getCurrentActorId(task.agenteId);

  const { error: historyError } = await supabase.from("task_history").insert({
    task_id: task.id,
    estado: task.estado,
    fecha: task.fechaCreacion,
    usuario_id: actorId,
    comentario: "Tarea creada",
  });

  if (historyError) {
    console.error("[tasks] task_history insert on create error", historyError);
  }

  return task;
};

export const updateTaskStatus = async (
  taskId: string,
  status: TaskStatus
): Promise<Task> => {
  const supabase = createSupabaseBrowserClient();
  const currentTask = await getTaskById(taskId);

  if (!currentTask) {
    throw new Error("Tarea no encontrada");
  }

  if (currentTask.estado === "vencida" && status === "completada") {
    throw new Error("No se puede completar una tarea vencida");
  }

  const completedAt = status === "completada" ? new Date().toISOString() : null;

  const { data, error } = await supabase
    .from("tasks")
    .update({
      estado: status,
      fecha_completada: completedAt,
    })
    .eq("id", taskId)
    .select(
      "id, lead_id, agente_id, titulo, tipo_tarea, descripcion, fecha_programada, estado, fecha_creacion, fecha_completada, leads(nombre)"
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo actualizar el estado de la tarea");
  }

  const task = mapTaskRow(data as TaskRow);
  const actorId = await getCurrentActorId(task.agenteId);

  const { error: historyError } = await supabase.from("task_history").insert({
    task_id: task.id,
    estado: status,
    fecha: new Date().toISOString(),
    usuario_id: actorId,
    comentario: `Estado actualizado a ${status}`,
  });

  if (historyError) {
    console.error("[tasks] task_history insert on status change error", historyError);
  }

  return task;
};

export const cancelTasksByLead = async (leadId: string): Promise<Task[]> => {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({
      estado: "cancelada",
      fecha_completada: null,
    })
    .eq("lead_id", leadId)
    .eq("estado", "pendiente")
    .select(
      "id, lead_id, agente_id, titulo, tipo_tarea, descripcion, fecha_programada, estado, fecha_creacion, fecha_completada, leads(nombre)"
    );

  if (error || !data) {
    console.error("[tasks] cancelTasksByLead error", error);
    return [];
  }

  const tasks = (data as TaskRow[]).map(mapTaskRow);

  await Promise.all(
    tasks.map(async (task) => {
      const actorId = await getCurrentActorId(task.agenteId);
      const { error: historyError } = await supabase.from("task_history").insert({
        task_id: task.id,
        estado: "cancelada",
        fecha: new Date().toISOString(),
        usuario_id: actorId,
        comentario: "Cancelada por cierre de lead",
      });
      if (historyError) {
        console.error("[tasks] task_history insert on cancel error", historyError);
      }
    })
  );

  return tasks;
};

export const getTaskHistory = async (taskId: string): Promise<TaskHistory[]> => {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("task_history")
    .select("id, task_id, estado, fecha, usuario_id, comentario")
    .eq("task_id", taskId)
    .order("fecha", { ascending: false });

  if (error || !data) {
    console.error("[tasks] getTaskHistory error", error);
    return [];
  }

  return (data as TaskHistoryRow[]).map(mapTaskHistoryRow);
};
