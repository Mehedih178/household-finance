import { formatCurrency } from "@/lib/utils";

export function StatCard({
  label,
  value,
  tone = "neutral"
}: {
  label: string;
  value: number;
  tone?: "neutral" | "good" | "bad";
}) {
  const toneClass =
    tone === "good" ? "text-app-success" : tone === "bad" ? "text-app-danger" : "text-app-text";

  return (
    <div className="ios-card p-4">
      <p className="text-sm font-medium text-app-muted">{label}</p>
      <p className={`mt-2 text-2xl font-bold tracking-tight ${toneClass}`}>{formatCurrency(value)}</p>
    </div>
  );
}
