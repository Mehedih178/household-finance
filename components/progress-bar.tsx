export function ProgressBar({ value }: { value: number }) {
  const width = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-app-line">
      <div
        className="h-full rounded-full bg-app-tint transition-all"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
