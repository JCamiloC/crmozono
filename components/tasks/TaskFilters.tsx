import type { TaskStatus } from "../../types";

type TaskFiltersProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  statusValue: TaskStatus | "all";
  onStatusChange: (value: TaskStatus | "all") => void;
  dateValue: string | "all";
  onDateChange: (value: string | "all") => void;
};

export default function TaskFilters({
  searchValue,
  onSearchChange,
  statusValue,
  onStatusChange,
  dateValue,
  onDateChange,
}: TaskFiltersProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-botanical-100 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 flex-col gap-2">
        <label className="text-xs font-semibold text-botanical-700">
          Buscar tarea
        </label>
        <input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Título o lead"
          className="w-full rounded-xl border border-botanical-100 px-3 py-2 text-sm focus:border-botanical-400 focus:outline-none focus:ring-2 focus:ring-botanical-100"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <label className="text-xs font-semibold text-botanical-700">Estado</label>
        <select
          value={statusValue}
          onChange={(event) =>
            onStatusChange(event.target.value as TaskStatus | "all")
          }
          className="w-full rounded-xl border border-botanical-100 px-3 py-2 text-sm focus:border-botanical-400 focus:outline-none focus:ring-2 focus:ring-botanical-100"
        >
          <option value="all">Todos</option>
          <option value="pendiente">Pendiente</option>
          <option value="completada">Completada</option>
          <option value="vencida">Vencida</option>
          <option value="cancelada">Cancelada</option>
        </select>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <label className="text-xs font-semibold text-botanical-700">Fecha</label>
        <select
          value={dateValue}
          onChange={(event) => onDateChange(event.target.value)}
          className="w-full rounded-xl border border-botanical-100 px-3 py-2 text-sm focus:border-botanical-400 focus:outline-none focus:ring-2 focus:ring-botanical-100"
        >
          <option value="all">Todas</option>
          <option value="today">Hoy</option>
          <option value="week">Esta semana</option>
          <option value="overdue">Vencidas</option>
        </select>
      </div>
    </div>
  );
}
