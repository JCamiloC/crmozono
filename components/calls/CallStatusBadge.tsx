import type { CallResult } from "../../types";

type CallStatusBadgeProps = {
  result: CallResult;
};

const resultStyles: Record<CallResult, string> = {
  venta: "bg-emerald-100 text-emerald-700",
  interesado: "bg-botanical-100 text-botanical-700",
  no_interesado: "bg-rose-100 text-rose-700",
  no_contesta: "bg-amber-100 text-amber-700",
  cortada: "bg-slate-200 text-slate-700",
  numero_incorrecto: "bg-slate-200 text-slate-700",
};

const resultLabels: Record<CallResult, string> = {
  venta: "Venta efectiva",
  interesado: "Cliente interesado",
  no_interesado: "No interesado",
  no_contesta: "No contesta",
  cortada: "Llamada cortada",
  numero_incorrecto: "Número incorrecto",
};

export default function CallStatusBadge({ result }: CallStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        resultStyles[result]
      }`}
    >
      {resultLabels[result]}
    </span>
  );
}
