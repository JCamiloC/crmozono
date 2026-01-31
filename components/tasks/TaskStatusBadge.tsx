import type { TaskStatus } from "../../types";

type TaskStatusBadgeProps = {
  status: TaskStatus;
};

const statusStyles: Record<TaskStatus, string> = {
  pendiente: "bg-botanical-100 text-botanical-700",
  completada: "bg-emerald-100 text-emerald-700",
  vencida: "bg-rose-100 text-rose-700",
  cancelada: "bg-slate-200 text-slate-700",
};

const statusLabels: Record<TaskStatus, string> = {
  pendiente: "Pendiente",
  completada: "Completada",
  vencida: "Vencida",
  cancelada: "Cancelada",
};

export default function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        statusStyles[status]
      }`}
    >
      {statusLabels[status]}
    </span>
  );
}
