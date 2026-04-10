type MessageComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
};

export default function MessageComposer({
  value,
  onChange,
  onSend,
  disabled = false,
}: MessageComposerProps) {
  const isDisabled = disabled || value.trim().length === 0;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-botanical-100 bg-white p-3">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && !isDisabled) {
            event.preventDefault();
            onSend();
          }
        }}
        placeholder="Escribe un mensaje"
        disabled={disabled}
        className="flex-1 bg-transparent text-sm text-botanical-900 focus:outline-none"
      />
      <button
        type="button"
        onClick={onSend}
        disabled={isDisabled}
        className="rounded-xl bg-botanical-700 px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-botanical-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {disabled ? "Enviando..." : "Enviar"}
      </button>
    </div>
  );
}
