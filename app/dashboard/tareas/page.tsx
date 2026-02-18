"use client";

import { useEffect, useState } from "react";
import TaskDetailPanel from "../../../components/tasks/TaskDetailPanel";
import TaskFilters from "../../../components/tasks/TaskFilters";
import TaskTable from "../../../components/tasks/TaskTable";
import type { Task, TaskHistory, TaskStatus } from "../../../types";
import {
  getTaskHistory,
  listTasks,
  updateTaskStatus,
} from "../../../services/tasks/tasks.service";
import { addAuditLog } from "../../../services/auditoria.service";

const reminderNotes = [
  "Recordatorio enviado a primera hora.",
  "Cliente solicitó posponer la llamada.",
  "Seguimiento programado para mañana.",
  "Pendiente de confirmación del cliente.",
];

export default function TareasPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [referenceNowMs, setReferenceNowMs] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const [statusValue, setStatusValue] = useState<TaskStatus | "all">("all");
  const [dateValue, setDateValue] = useState<string | "all">("all");
  const [orderValue, setOrderValue] = useState<
    "due_asc" | "due_desc" | "title_asc" | "title_desc" | "status"
  >("due_asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [lastReminderNote, setLastReminderNote] = useState<string | null>(null);
  const [history, setHistory] = useState<TaskHistory[]>([]);

  const PAGE_SIZE = 10;

  useEffect(() => {
    const intervalId = setInterval(() => {
      setReferenceNowMs(Date.now());
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const load = async () => {
      const data = await listTasks();
      setTasks(data);
      setReferenceNowMs(Date.now());
      if (data.length > 0) {
        setSelectedTaskId(data[0].id);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      if (!selectedTaskId) return;
      const data = await getTaskHistory(selectedTaskId);
      setHistory(data);
    };
    loadHistory();
  }, [selectedTaskId]);

  const filteredTasks = tasks.filter((task) => {
    const searchMatch =
      task.titulo.toLowerCase().includes(searchValue.toLowerCase()) ||
      task.leadNombre.toLowerCase().includes(searchValue.toLowerCase());
    const statusMatch = statusValue === "all" || task.estado === statusValue;
    const dueDate = new Date(task.fechaProgramada).getTime();
    const now = referenceNowMs;
    const isToday =
      new Date(dueDate).toDateString() === new Date(now).toDateString();
    const isWithinWeek = dueDate <= now + 1000 * 60 * 60 * 24 * 7;
    const isOverdue = dueDate < now;

    const dateMatch =
      dateValue === "all" ||
      (dateValue === "today" && isToday) ||
      (dateValue === "week" && isWithinWeek) ||
      (dateValue === "overdue" && isOverdue);

    return searchMatch && statusMatch && dateMatch;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (orderValue === "due_desc") {
      return new Date(b.fechaProgramada).getTime() - new Date(a.fechaProgramada).getTime();
    }

    if (orderValue === "title_asc") {
      return a.titulo.localeCompare(b.titulo, "es");
    }

    if (orderValue === "title_desc") {
      return b.titulo.localeCompare(a.titulo, "es");
    }

    if (orderValue === "status") {
      return a.estado.localeCompare(b.estado, "es");
    }

    return new Date(a.fechaProgramada).getTime() - new Date(b.fechaProgramada).getTime();
  });

  const totalPages = Math.max(1, Math.ceil(sortedTasks.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedTasks = sortedTasks.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE
  );

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;

  const overdueCount = tasks.filter((task) => {
    const dueAtMs = new Date(task.fechaProgramada).getTime();
    return task.estado === "vencida" || (task.estado === "pendiente" && dueAtMs < referenceNowMs);
  }).length;

  const dueSoonCount = tasks.filter((task) => {
    if (task.estado !== "pendiente") {
      return false;
    }

    const dueAtMs = new Date(task.fechaProgramada).getTime();
    const inNext24h = dueAtMs >= referenceNowMs && dueAtMs <= referenceNowMs + 1000 * 60 * 60 * 24;
    return inNext24h;
  }).length;

  const handleStatusChange = async (status: TaskStatus) => {
    if (!selectedTask) return;
    const updated = await updateTaskStatus(selectedTask.id, status);
    setTasks((prev) => prev.map((task) => (task.id === updated.id ? updated : task)));
    const updatedHistory = await getTaskHistory(updated.id);
    setHistory(updatedHistory);
    await addAuditLog(
      "task_status_change",
      "task",
      updated.id,
      `Estado de tarea actualizado a ${status}`,
      "Agente"
    );
  };

  const handleSimulateReminder = () => {
    const note = reminderNotes[Math.floor(Math.random() * reminderNotes.length)];
    setLastReminderNote(note);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-botanical-900">Tareas</h1>
        <p className="text-sm text-botanical-600">
          Recordatorios y actividades comerciales por lead.
        </p>
      </div>

      <TaskFilters
        searchValue={searchValue}
        onSearchChange={(value) => {
          setSearchValue(value);
          setCurrentPage(1);
        }}
        statusValue={statusValue}
        onStatusChange={(value) => {
          setStatusValue(value);
          setCurrentPage(1);
        }}
        dateValue={dateValue}
        onDateChange={(value) => {
          setDateValue(value);
          setCurrentPage(1);
        }}
      />

      {(overdueCount > 0 || dueSoonCount > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold">Tareas por vencer</p>
            <p>{dueSoonCount} tarea(s) vencen en las próximas 24 horas.</p>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <p className="font-semibold">Tareas vencidas</p>
            <p>{overdueCount} tarea(s) requieren gestión inmediata.</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-botanical-500">
              Tareas activas
            </p>
            <div className="flex items-center gap-2 text-xs text-botanical-700">
              <span>Ordenar por</span>
              <select
                value={orderValue}
                onChange={(event) => {
                  setOrderValue(event.target.value as typeof orderValue);
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-botanical-200 bg-white px-2 py-1.5 text-xs text-botanical-800"
              >
                <option value="due_asc">Próximas primero</option>
                <option value="due_desc">Más lejanas primero</option>
                <option value="title_asc">Título A-Z</option>
                <option value="title_desc">Título Z-A</option>
                <option value="status">Estado</option>
              </select>
            </div>
          </div>

          {sortedTasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-botanical-200 bg-white p-6 text-sm text-botanical-600">
              No hay tareas para los filtros actuales.
            </div>
          ) : (
            <>
              <TaskTable
                tasks={paginatedTasks}
                selectedTaskId={selectedTaskId}
                onSelect={setSelectedTaskId}
              />
              {totalPages > 1 ? (
                <div className="mt-2 flex items-center justify-between text-xs text-botanical-700">
                  <span>
                    Página {safeCurrentPage} de {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={safeCurrentPage === 1}
                      className="rounded-lg border border-botanical-300 bg-white px-3 py-1.5 disabled:opacity-60"
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={safeCurrentPage === totalPages}
                      className="rounded-lg border border-botanical-300 bg-white px-3 py-1.5 disabled:opacity-60"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
        <TaskDetailPanel
          task={selectedTask}
          onChangeStatus={handleStatusChange}
          onSimulateReminder={handleSimulateReminder}
          lastReminderNote={lastReminderNote}
          history={history}
        />
      </div>
    </div>
  );
}
