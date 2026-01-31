import type { Task, TaskHistory, TaskStatus } from "../../types";
import TaskStatusBadge from "./TaskStatusBadge";

type TaskDetailPanelProps = {
  task: Task | null;
  onChangeStatus: (status: TaskStatus) => void;
  onSimulateReminder: () => void;
  lastReminderNote: string | null;
  history: TaskHistory[];
};

export default function TaskDetailPanel({
  task,
  onChangeStatus,
  onSimulateReminder,
  lastReminderNote,
  history,
}: TaskDetailPanelProps) {
  if (!task) {
    return (
      <div className="rounded-2xl border border-dashed border-botanical-200 bg-white p-6 text-sm text-botanical-600">
        Selecciona una tarea para ver detalles.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-botanical-100 bg-white p-6 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-botanical-500">
          Detalle de tarea
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-botanical-900">
          {task.titulo}
        </h2>
        <p className="text-sm text-botanical-600">{task.leadNombre}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <TaskStatusBadge status={task.estado} />
        <span className="text-xs text-botanical-600">
          Programada: {new Date(task.fechaProgramada).toLocaleDateString()}
        </span>
      </div>

      <div className="grid gap-4 text-sm text-botanical-700 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-botanical-500">
            Tipo de tarea
          </p>
          <p className="mt-2 font-semibold text-botanical-900">{task.tipoTarea}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-botanical-500">
            Responsable
          </p>
          <p className="mt-2 font-semibold text-botanical-900">{task.agenteId}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-botanical-500">
            Creación
          </p>
          <p className="mt-2 font-semibold text-botanical-900">
            {new Date(task.fechaCreacion).toLocaleDateString()}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-botanical-500">
            Estado actual
          </p>
          <p className="mt-2 font-semibold text-botanical-900">{task.estado}</p>
        </div>
      </div>

      {task.descripcion ? (
        <div className="rounded-2xl border border-botanical-100 bg-botanical-50 p-4 text-sm text-botanical-700">
          {task.descripcion}
        </div>
      ) : null}

      <div className="grid gap-3">
        <label className="text-xs font-semibold text-botanical-700">
          Cambiar estado
        </label>
        <select
          value={task.estado}
          onChange={(event) => onChangeStatus(event.target.value as TaskStatus)}
          className="rounded-xl border border-botanical-100 px-3 py-2 text-sm text-botanical-800 focus:border-botanical-400 focus:outline-none focus:ring-2 focus:ring-botanical-100"
        >
          <option value="pendiente">Pendiente</option>
          <option value="completada">Completada</option>
          <option value="vencida">Vencida</option>
          <option value="cancelada">Cancelada</option>
        </select>
      </div>

      <div className="rounded-2xl border border-botanical-100 bg-botanical-50 p-4 text-sm text-botanical-700">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-botanical-500">
              Último recordatorio (simulado)
            </p>
            <p className="mt-2 text-sm font-semibold text-botanical-900">
              {lastReminderNote ?? "Sin recordatorios enviados"}
            </p>
          </div>
          <button
            type="button"
            onClick={onSimulateReminder}
            className="rounded-xl border border-botanical-200 bg-white px-3 py-2 text-xs font-semibold text-botanical-700 shadow-sm transition hover:bg-botanical-100"
          >
            Simular recordatorio
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-botanical-100 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-botanical-500">
          Historial de estados
        </p>
        <div className="mt-3 space-y-2 text-xs text-botanical-700">
          {history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-botanical-200 bg-botanical-50 p-3 text-botanical-600">
              Sin historial registrado.
            </div>
          ) : (
            history.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <span>{item.estado}</span>
                <span className="text-botanical-500">
                  {new Date(item.fecha).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
