type SectionSkeletonProps = {
  lines?: number;
};

export default function SectionSkeleton({ lines = 3 }: SectionSkeletonProps) {
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-4 animate-pulse rounded bg-botanical-100"
          style={{ width: `${Math.max(50, 100 - index * 12)}%` }}
        />
      ))}
    </div>
  );
}
