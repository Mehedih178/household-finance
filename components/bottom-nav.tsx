"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CreditCard, Home, PieChart, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/transactions", label: "Activity", icon: CreditCard },
  { href: "/budgets", label: "Budgets", icon: PieChart },
  { href: "/notifications", label: "Inbox", icon: Bell },
  { href: "/settings", label: "More", icon: Settings }
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-app-line/80 bg-app-card/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      <div className="mx-auto grid max-w-md grid-cols-5 px-2 pt-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-medium text-app-muted transition",
                active && "text-app-tint"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={22} strokeWidth={active ? 2.6 : 2.2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
