export function ProgressRing({
  color = "#007aff",
  label,
  value
}: {
  color?: string;
  label: string;
  value: number;
}) {
  const percent = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div
      className="grid h-20 w-20 shrink-0 place-items-center rounded-full"
      style={{
        background: `conic-gradient(${color} ${percent * 3.6}deg, rgb(var(--app-line)) 0deg)`
      }}
      aria-label={label}
    >
      <div className="grid h-14 w-14 place-items-center rounded-full bg-app-card">
        <span className="text-sm font-bold text-app-text">{percent}%</span>
      </div>
    </div>
  );
}
