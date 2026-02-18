"use client";

import { useEffect, useState } from "react";

type AutomationPanelProps = {
  enabled: boolean;
  minutes: number;
  saving: boolean;
  running: boolean;
  onEnabledChange: (value: boolean) => void;
  onMinutesChange: (value: number) => void;
  onSave: () => Promise<void>;
  onRunNow: () => Promise<void>;
  runSummary: string | null;
  errorMessage: string | null;
};

export default function AutomationPanel({
  enabled,
  minutes,
  saving,
  running,
  onEnabledChange,
  onMinutesChange,
  onSave,
  onRunNow,
  runSummary,
  errorMessage,
}: AutomationPanelProps) {
  const [minutesInput, setMinutesInput] = useState(String(minutes));

  useEffect(() => {
    setMinutesInput(String(minutes));
  }, [minutes]);

  return (
    <div className="rounded-2xl border border-botanical-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-botanical-900">Automatización no respuesta</h2>
      <p className="mt-1 text-sm text-botanical-600">
        Crea tarea automática si un lead en contacto/seguimiento no responde en X minutos.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[auto_160px_auto_auto] sm:items-center">
        <label className="inline-flex items-center gap-2 text-sm text-botanical-800">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => onEnabledChange(event.target.checked)}
            className="h-4 w-4 rounded border-botanical-300"
          />
          Activar
        </label>

        <input
          type="number"
          min={1}
          max={120}
          value={minutesInput}
          onChange={(event) => {
            setMinutesInput(event.target.value);
            const parsed = Number(event.target.value);
            if (Number.isFinite(parsed)) {
              onMinutesChange(parsed);
            }
          }}
          className="rounded-xl border border-botanical-200 px-3 py-2 text-sm text-botanical-800"
        />

        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-xl bg-botanical-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-botanical-800 disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>

        <button
          type="button"
          onClick={onRunNow}
          disabled={running}
          className="rounded-xl border border-botanical-300 bg-white px-3 py-2 text-xs font-semibold text-botanical-800 transition hover:bg-botanical-50 disabled:opacity-60"
        >
          {running ? "Ejecutando..." : "Ejecutar ahora"}
        </button>
      </div>

      <p className="mt-2 text-xs text-botanical-600">Recomendado para pruebas: 5 a 10 minutos.</p>

      {errorMessage ? (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {runSummary ? (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {runSummary}
        </div>
      ) : null}
    </div>
  );
}
