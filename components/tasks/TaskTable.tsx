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
    <div className="space-y-3">
      <div className="space-y-2 md:hidden">
        {tasks.map((task) => (
          <button
            key={task.id}
            type="button"
            className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
              selectedTaskId === task.id
                ? "border-botanical-300 bg-botanical-50"
                : "border-botanical-100 bg-white hover:border-botanical-200"
            }`}
            onClick={() => onSelect(task.id)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-botanical-900">{task.titulo}</p>
                <p className="mt-0.5 text-xs text-botanical-600">{task.tipoTarea}</p>
              </div>
              <TaskStatusBadge status={task.estado} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-botanical-700">
              <div>
                <p className="font-semibold text-botanical-600">Lead</p>
                <p className="truncate">{task.leadNombre}</p>
              </div>
              <div>
                <p className="font-semibold text-botanical-600">Vence</p>
                <p>{new Date(task.fechaProgramada).toLocaleDateString()}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-botanical-100 bg-white shadow-sm md:block">
        <table className="w-full min-w-[680px] text-left text-sm">
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
    </div>
  );
}
