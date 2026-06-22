import { BottomNav } from "@/components/bottom-nav";
import { BackButton } from "@/components/back-button";

export function AppShell({
  children,
  title,
  action,
  backHref,
  backLabel = "Back"
}: {
  children: React.ReactNode;
  title: string;
  action?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <main className="mx-auto min-h-dvh max-w-md bg-app-bg pb-[calc(88px+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-20 border-b border-app-line/70 bg-app-bg/85 px-5 pb-3 pt-[calc(14px+env(safe-area-inset-top))] backdrop-blur-xl">
        {backHref ? (
          <div className="mb-1">
            <BackButton href={backHref} label={backLabel} />
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-[28px] font-bold tracking-tight text-app-text">{title}</h1>
          {action}
        </div>
      </header>
      <div className="px-5 py-5">{children}</div>
      <BottomNav />
    </main>
  );
}
