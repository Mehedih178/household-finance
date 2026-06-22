import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { budgetAlert, daysLeftInMonth, monthRange } from "@/lib/budgeting";
import { requireHousehold } from "@/lib/data";
import { formatCurrency, monthKey } from "@/lib/utils";

type Alert = {
  id: string;
  title: string;
  detail: string;
  emoji: string;
  href: string;
};

export default async function NotificationsPage() {
  const { supabase, householdId } = await requireHousehold();
  const month = monthRange(monthKey());
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 6);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const [{ data: budgets }, { data: transactions }, { data: goals }, { data: contributions }, { data: recurring }] = await Promise.all([
    supabase.from("budgets").select("*, categories(name)").eq("household_id", householdId).eq("month", month.start),
    supabase
      .from("transactions")
      .select("*, categories(name)")
      .eq("household_id", householdId)
      .gte("occurred_on", month.start)
      .lt("occurred_on", month.end),
    supabase.from("goals").select("*").eq("household_id", householdId),
    supabase.from("goal_contributions").select("*").eq("household_id", householdId),
    supabase.from("recurring_items").select("*").eq("household_id", householdId).order("next_due_on")
  ]);

  const alerts: Alert[] = [];
  const daysLeft = daysLeftInMonth(monthKey());

  for (const budget of budgets ?? []) {
    const spent = (transactions ?? [])
      .filter((transaction) => transaction.kind === "expense" && transaction.category_id === budget.category_id)
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
    const categoryName = budget.categories?.name ?? "Budget";
    const message = budgetAlert({
      budgetAmount: Number(budget.amount),
      categoryName,
      daysLeft,
      spent
    });

    if (message) {
      alerts.push({
        id: `budget-${budget.id}`,
        title: `${categoryName} budget alert`,
        detail: message,
        emoji: "🔔",
        href: "/budgets"
      });
    }
  }

  for (const goal of goals ?? []) {
    const saved = (contributions ?? [])
      .filter((item) => item.goal_id === goal.id)
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const percent = Number(goal.target_amount) ? Math.round((saved / Number(goal.target_amount)) * 100) : 0;
    if (percent >= 100 || percent >= 50) {
      alerts.push({
        id: `goal-${goal.id}`,
        title: `${goal.name} reached ${Math.min(100, percent)}%`,
        detail: `${formatCurrency(saved)} saved toward ${formatCurrency(Number(goal.target_amount))}.`,
        emoji: percent >= 100 ? "🏆" : "🎯",
        href: "/goals"
      });
    }
  }

  for (const item of recurring ?? []) {
    if (item.next_due_on <= tomorrow.toISOString().slice(0, 10)) {
      alerts.push({
        id: `recurring-${item.id}`,
        title: `${item.description} due soon`,
        detail: `${formatCurrency(Number(item.amount))} is due ${item.next_due_on}.`,
        emoji: "📅",
        href: "/recurring"
      });
    }
  }

  const weeklyTransactions = (transactions ?? []).filter((transaction) => transaction.occurred_on >= weekStart.toISOString().slice(0, 10));
  const weeklySpent = weeklyTransactions.filter((item) => item.kind === "expense").reduce((sum, item) => sum + Number(item.amount), 0);
  const weeklySaved = weeklyTransactions.filter((item) => item.kind === "income").reduce((sum, item) => sum + Number(item.amount), 0) - weeklySpent;
  alerts.unshift({
    id: "weekly-summary",
    title: "Weekly summary",
    detail: `Spent ${formatCurrency(weeklySpent)} this week. Saved ${formatCurrency(weeklySaved)}.`,
    emoji: "📊",
    href: "/reports"
  });

  return (
    <AppShell title="Alerts" backHref="/settings">
      <section className="ios-card p-4">
        <h2 className="text-lg font-bold text-app-text">Notification center</h2>
        <p className="mt-1 text-sm text-app-muted">
          Budget alerts, goal milestones, recurring bills, and weekly summaries. Push notifications can be added later.
        </p>
      </section>

      <section className="mt-5 grid gap-3">
        {alerts.map((alert) => (
          <Link key={alert.id} href={alert.href} className="ios-card flex gap-3 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-app-bg text-xl">{alert.emoji}</div>
            <div>
              <p className="font-semibold text-app-text">{alert.title}</p>
              <p className="mt-1 text-sm leading-5 text-app-muted">{alert.detail}</p>
            </div>
          </Link>
        ))}
      </section>
    </AppShell>
  );
}
