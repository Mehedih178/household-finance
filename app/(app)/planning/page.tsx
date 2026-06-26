import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ProgressBar } from "@/components/progress-bar";
import { monthRange } from "@/lib/budgeting";
import { requireHousehold } from "@/lib/data";
import { formatCurrency, monthKey } from "@/lib/utils";

const planningLinks = [
  { href: "/budgets", title: "Budgets", detail: "Monthly envelopes and rollover", emoji: "💸" },
  { href: "/goals", title: "Goals", detail: "Vacation, emergency fund, and shared savings", emoji: "🎯" },
  { href: "/reports", title: "Reports", detail: "Health score, trends, and spending breakdown", emoji: "📊" },
  { href: "/wealth", title: "Wealth", detail: "Net worth, milestones, and FIRE estimate", emoji: "📈" },
  { href: "/recurring", title: "Bills", detail: "Recurring income, subscriptions, and due dates", emoji: "🔄" },
  { href: "/notifications", title: "Briefing", detail: "Daily read on what needs attention", emoji: "🔔" },
  { href: "/meeting", title: "Meeting", detail: "Monthly review for both of you", emoji: "🗓️" },
  { href: "/feed", title: "Feed", detail: "Household activity timeline", emoji: "❤️" }
];

export default async function PlanningPage() {
  const { supabase, householdId } = await requireHousehold();
  const month = monthRange(monthKey());
  const [{ data: budgets }, { data: transactions }, { data: goals }, { data: contributions }, { data: recurring }] = await Promise.all([
    supabase.from("budgets").select("*, categories(name)").eq("household_id", householdId).eq("month", month.start),
    supabase.from("transactions").select("*").eq("household_id", householdId).gte("occurred_on", month.start).lt("occurred_on", month.end),
    supabase.from("goals").select("*").eq("household_id", householdId).order("created_at", { ascending: false }),
    supabase.from("goal_contributions").select("*").eq("household_id", householdId),
    supabase.from("recurring_items").select("*").eq("household_id", householdId).order("next_due_on")
  ]);

  const spent = (transactions ?? [])
    .filter((transaction) => transaction.kind === "expense")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const budgeted = (budgets ?? []).reduce((sum, budget) => sum + Number(budget.amount), 0);
  const budgetPercent = budgeted ? (spent / budgeted) * 100 : 0;
  const topGoal = (goals ?? []).map((goal) => {
    const saved = (contributions ?? [])
      .filter((contribution) => contribution.goal_id === goal.id)
      .reduce((sum, contribution) => sum + Number(contribution.amount), 0);
    return {
      ...goal,
      percent: Number(goal.target_amount) ? Math.round((saved / Number(goal.target_amount)) * 100) : 0,
      saved
    };
  }).sort((first, second) => second.percent - first.percent)[0];
  const nextBill = recurring?.[0];

  return (
    <AppShell title="Plan">
      <section className="rounded-[30px] bg-app-card p-5 shadow-ios-sm">
        <p className="text-sm font-semibold text-app-muted">This month</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-app-text">
          {budgeted ? `${Math.round(budgetPercent)}% of budget used` : "Set your monthly plan"}
        </p>
        <div className="mt-4">
          <ProgressBar value={budgetPercent} />
        </div>
        <p className="mt-3 text-sm text-app-muted">
          {formatCurrency(Math.max(0, budgeted - spent))} remaining · {formatCurrency(spent)} spent
        </p>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3">
        <div className="ios-card p-4">
          <p className="text-sm text-app-muted">Top goal</p>
          <p className="mt-1 font-bold text-app-text">{topGoal ? topGoal.name : "No goal yet"}</p>
          <p className="mt-1 text-sm text-app-muted">{topGoal ? `${topGoal.percent}% funded` : "Create one together"}</p>
        </div>
        <div className="ios-card p-4">
          <p className="text-sm text-app-muted">Next bill</p>
          <p className="mt-1 font-bold text-app-text">{nextBill ? nextBill.description : "None"}</p>
          <p className="mt-1 text-sm text-app-muted">{nextBill ? `${formatCurrency(Number(nextBill.amount))} · ${nextBill.next_due_on}` : "Add recurring items"}</p>
        </div>
      </section>

      <section className="mt-5">
        <h2 className="mb-3 text-2xl font-bold tracking-tight text-app-text">Plan together</h2>
        <div className="grid gap-3">
          {planningLinks.map((item) => (
            <Link key={item.href} href={item.href} className="ios-card flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-app-bg text-2xl">{item.emoji}</div>
              <div className="min-w-0">
                <p className="font-bold text-app-text">{item.title}</p>
                <p className="mt-1 text-sm leading-5 text-app-muted">{item.detail}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
