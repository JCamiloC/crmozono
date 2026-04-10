type AlertTone = "info" | "success" | "warning" | "danger";

type AlertBannerProps = {
  message: string;
  tone?: AlertTone;
  className?: string;
};

const TONE_STYLES: Record<AlertTone, string> = {
  info: "border-botanical-200 bg-botanical-50 text-botanical-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
};

export default function AlertBanner({
  message,
  tone = "info",
  className = "",
}: AlertBannerProps) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${TONE_STYLES[tone]} ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
