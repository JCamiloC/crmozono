import type { Call, CallResult } from "../../types";
import CallStatusBadge from "./CallStatusBadge";

type CallDetailPanelProps = {
  call: Call | null;
  onRegisterResult: (result: CallResult, notes: string) => void;
};

export default function CallDetailPanel({
  call,
  onRegisterResult,
}: CallDetailPanelProps) {
  if (!call) {
    return (
      <div className="rounded-2xl border border-dashed border-botanical-200 bg-white p-6 text-sm text-botanical-600">
        Selecciona una llamada para ver detalles.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-botanical-100 bg-white p-6 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-botanical-500">
          Llamada
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-botanical-900">
          {call.leadName}
        </h2>
        <p className="text-sm text-botanical-600">{call.leadPhone}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <CallStatusBadge result={call.result} />
        <span className="text-xs text-botanical-600">
          Duración: {call.durationMinutes} min
        </span>
      </div>

      <div className="grid gap-4 text-sm text-botanical-700 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-botanical-500">
            Agente
          </p>
          <p className="mt-2 font-semibold text-botanical-900">{call.agentName}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-botanical-500">
            Fecha
          </p>
          <p className="mt-2 font-semibold text-botanical-900">
            {new Date(call.startedAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-botanical-100 bg-botanical-50 p-4 text-sm text-botanical-700">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-botanical-500">
          Observaciones
        </p>
        <p className="mt-2 text-sm font-semibold text-botanical-900">
          {call.notes ?? "Sin observaciones"}
        </p>
      </div>

      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const formData = new FormData(form);
          const result = formData.get("result") as CallResult;
          const notes = String(formData.get("notes") ?? "");
          onRegisterResult(result, notes);
          form.reset();
        }}
      >
        <div>
          <label className="text-xs font-semibold text-botanical-700">Resultado</label>
          <select
            name="result"
            defaultValue={call.result}
            className="mt-2 w-full rounded-xl border border-botanical-100 px-3 py-2 text-sm focus:border-botanical-400 focus:outline-none focus:ring-2 focus:ring-botanical-100"
          >
            <option value="venta">Venta efectiva</option>
            <option value="interesado">Cliente interesado</option>
            <option value="no_interesado">No interesado</option>
            <option value="no_contesta">No contesta</option>
            <option value="cortada">Llamada cortada</option>
            <option value="numero_incorrecto">Número incorrecto</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-botanical-700">Notas</label>
          <textarea
            name="notes"
            rows={3}
            className="mt-2 w-full rounded-xl border border-botanical-100 px-3 py-2 text-sm focus:border-botanical-400 focus:outline-none focus:ring-2 focus:ring-botanical-100"
            placeholder="Observaciones de la llamada"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-botanical-700 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-botanical-800"
        >
          Registrar resultado
        </button>
      </form>
    </div>
  );
}
