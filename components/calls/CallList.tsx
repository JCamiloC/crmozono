import type { Call } from "../../types";
import CallStatusBadge from "./CallStatusBadge";

type CallListProps = {
  calls: Call[];
  selectedId: string | null;
  onSelect: (callId: string) => void;
};

export default function CallList({ calls, selectedId, onSelect }: CallListProps) {
  return (
    <div className="space-y-3">
      {calls.map((call) => (
        <button
          key={call.id}
          type="button"
          onClick={() => onSelect(call.id)}
          className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-4 text-left transition ${
            selectedId === call.id
              ? "border-botanical-200 bg-botanical-50"
              : "border-botanical-100 bg-white hover:bg-botanical-50/70"
          }`}
        >
          <div>
            <p className="text-sm font-semibold text-botanical-900">
              {call.leadName}
            </p>
            <p className="text-xs text-botanical-600">{call.leadPhone}</p>
          </div>
          <CallStatusBadge result={call.result} />
        </button>
      ))}
    </div>
  );
}
