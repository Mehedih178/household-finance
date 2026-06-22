import { cn } from "@/lib/utils";

export function Field({
  label,
  children,
  className
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("grid gap-2 text-sm font-semibold text-app-text", className)}>
      <span className="px-1 text-app-muted">{label}</span>
      {children}
    </label>
  );
}

export function ToggleRow({
  label,
  description,
  name,
  defaultChecked = true
}: {
  label: string;
  description: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl border border-app-line bg-app-card p-4">
      <span>
        <span className="block font-semibold text-app-text">{label}</span>
        <span className="text-sm text-app-muted">{description}</span>
      </span>
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="h-6 w-6 accent-[rgb(var(--app-tint))]"
      />
    </label>
  );
}
