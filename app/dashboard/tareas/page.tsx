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
  const [lastReminderNote, setLastReminderNote] = useState<string | null>(null);
  const [history, setHistory] = useState<TaskHistory[]>([]);

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

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;

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
        onSearchChange={setSearchValue}
        statusValue={statusValue}
        onStatusChange={setStatusValue}
        dateValue={dateValue}
        onDateChange={setDateValue}
      />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-botanical-500">
            Tareas activas
          </p>
          {filteredTasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-botanical-200 bg-white p-6 text-sm text-botanical-600">
              No hay tareas para los filtros actuales.
            </div>
          ) : (
            <TaskTable
              tasks={filteredTasks}
              selectedTaskId={selectedTaskId}
              onSelect={setSelectedTaskId}
            />
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
