"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, Home, ListChecks, Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Home", icon: Home, variant: "tab" },
  { href: "/transactions", label: "Activity", icon: CreditCard, variant: "tab" },
  { href: "/transactions/new", label: "Add", icon: Plus, variant: "action" },
  { href: "/planning", label: "Budget", icon: ListChecks, variant: "tab" },
  { href: "/settings", label: "More", icon: Settings, variant: "tab" }
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-app-line/10 bg-app-card/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      <div className="mx-auto grid max-w-md grid-cols-5 px-2 pt-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/transactions/new"
            ? false
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={cn(
                item.variant === "action"
                  ? "mx-auto -mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-app-tint text-white shadow-ios-sm transition duration-150 ease-out active:scale-[0.94]"
                  : "flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-medium text-app-muted transition duration-150 ease-out active:scale-[0.94]",
                item.variant !== "action" && active && "bg-app-tint/10 text-app-tint"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={item.variant === "action" ? 24 : 22} strokeWidth={item.variant === "action" ? 2.8 : active ? 2.6 : 2.2} />
              {item.variant !== "action" ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
