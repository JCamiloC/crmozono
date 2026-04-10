type EmptyStateProps = {
  title: string;
  description?: string;
  compact?: boolean;
  className?: string;
};

export default function EmptyState({
  title,
  description,
  compact = false,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-xl border border-dashed border-botanical-200 bg-botanical-50/40 text-botanical-600 ${
        compact ? "px-4 py-3" : "px-4 py-5"
      } ${className}`.trim()}
    >
      <p className="text-sm font-medium text-botanical-700">{title}</p>
      {description ? <p className="mt-1 text-sm">{description}</p> : null}
    </div>
  );
}
