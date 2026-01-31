import type { Task } from "../../types";
import TaskStatusBadge from "./TaskStatusBadge";

type TaskTableProps = {
  tasks: Task[];
  selectedTaskId: string | null;
  onSelect: (taskId: string) => void;
};

export default function TaskTable({
  tasks,
  selectedTaskId,
  onSelect,
}: TaskTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-botanical-100 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-botanical-50 text-xs uppercase tracking-[0.08em] text-botanical-600">
          <tr>
            <th className="px-4 py-3">Tarea</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Lead</th>
            <th className="px-4 py-3">Vence</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr
              key={task.id}
              className={`cursor-pointer border-t border-botanical-100 transition hover:bg-botanical-50/70 ${
                selectedTaskId === task.id ? "bg-botanical-50" : "bg-white"
              }`}
              onClick={() => onSelect(task.id)}
            >
              <td className="px-4 py-3 font-semibold text-botanical-900">
                {task.titulo}
                <p className="text-xs font-normal text-botanical-600">
                  {task.tipoTarea}
                </p>
              </td>
              <td className="px-4 py-3">
                <TaskStatusBadge status={task.estado} />
              </td>
              <td className="px-4 py-3 text-botanical-700">{task.leadNombre}</td>
              <td className="px-4 py-3 text-botanical-700">
                {new Date(task.fechaProgramada).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
