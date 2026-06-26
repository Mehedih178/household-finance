import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getDashboardData } from "@/lib/data";
import { categoryEmoji, formatCurrency, formatShortDate, monthKey } from "@/lib/utils";

export default async function DashboardPage() {
  const currentMonth = monthKey();
  const data = await getDashboardData(currentMonth);
  const expenses = data.transactions
    .filter((transaction) => transaction.kind === "expense")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const totalBudgeted = data.budgets.reduce((sum, budget) => sum + Number(budget.amount), 0);
  const remainingBudget = totalBudgeted - expenses;
  const budgetUsedPercent = totalBudgeted > 0 ? Math.min(100, Math.max(0, (expenses / totalBudgeted) * 100)) : 0;
  const nextBill = data.recurring[0];
  const previousExpenses = data.previousTransactions
    .filter((transaction) => transaction.kind === "expense")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const spendingDelta = previousExpenses > 0
    ? Math.round(((expenses - previousExpenses) / previousExpenses) * 100)
    : null;
  const topGoal = data.goals
    .map((goal) => {
      const saved = data.goalContributions
        .filter((contribution) => contribution.goal_id === goal.id)
        .reduce((sum, contribution) => sum + Number(contribution.amount), 0);
      const percent = Number(goal.target_amount) > 0 ? Math.round((saved / Number(goal.target_amount)) * 100) : 0;
      return { ...goal, percent, saved };
    })
    .sort((first, second) => second.percent - first.percent)[0];

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? "Good morning" : greetingHour < 18 ? "Good afternoon" : "Good evening";
  const monthLabel = new Date(`${currentMonth}-01T00:00:00`).toLocaleDateString("en-US", { month: "long" });
  const householdStatus = remainingBudget >= 0 ? "Your household is doing well." : "Your household needs attention.";
  const spendingLine = spendingDelta === null
    ? "Add another month of history to compare your pace."
    : `${Math.abs(spendingDelta)}% ${spendingDelta > 0 ? "more" : "less"} spent than last month`;
  const billLine = nextBill
    ? `${nextBill.description} due ${formatShortDate(nextBill.next_due_on)}`
    : "No bills due soon";
  const householdLine = data.memberships.length > 1
    ? `${data.memberships.length} people are sharing this plan`
    : "Invite your partner to manage money together";

  return (
    <AppShell
      title="Today"
      action={
        <Link href="/transactions/new" className="ios-button h-11 min-h-11 rounded-full px-4" aria-label="Add transaction">
          <Plus size={20} />
        </Link>
      }
    >
      <section className="ios-card p-5">
        <p className="text-lg font-medium text-app-muted">{greeting}</p>
        <p className="mt-2 text-3xl font-extrabold tracking-tight text-app-text">{householdStatus}</p>
        <div className="mt-5 rounded-ios bg-app-tint p-4 text-white shadow-ios-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold opacity-85">{monthLabel}</p>
              <p className="mt-1 text-sm opacity-85">Available this month</p>
            </div>
            <Link href="/planning" className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white">
              Open plan
            </Link>
          </div>
          <p className="mt-3 text-[2.4rem] font-extrabold tracking-tight">{formatCurrency(remainingBudget)}</p>
          <p className="mt-2 text-sm opacity-85">{spendingLine}</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${budgetUsedPercent}%` }} />
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-app-bg px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-app-muted">Coming up</p>
            <p className="mt-2 text-sm font-semibold text-app-text">{billLine}</p>
          </div>
          <div className="rounded-2xl bg-app-bg px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-app-muted">This month</p>
            <p className="mt-2 text-sm font-semibold text-app-text">{formatCurrency(expenses)} spent so far</p>
          </div>
          <div className="rounded-2xl bg-app-bg px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-app-muted">Household</p>
            <p className="mt-2 text-sm font-semibold text-app-text">{householdLine}</p>
          </div>
        </div>
      </section>

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-app-text">What matters today</h2>
          <Link href="/planning" className="text-sm font-semibold text-app-tint">See plan</Link>
        </div>
        <div className="grid gap-3">
          <div className="ios-card p-4">
            <p className="text-sm font-semibold text-app-muted">Spending pace</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-app-text">{formatCurrency(expenses)} spent so far</p>
            <p className="mt-1 text-sm text-app-muted">
              {data.transactions.length} transaction{data.transactions.length === 1 ? "" : "s"} reviewed this month
            </p>
          </div>
          <div className="ios-card p-4">
            <p className="text-sm font-semibold text-app-muted">Upcoming bill</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-app-text">
              {nextBill ? formatCurrency(Number(nextBill.amount)) : "All clear"}
            </p>
            <p className="mt-1 text-sm text-app-muted">{billLine}</p>
          </div>
          <div className="ios-card p-4">
            <p className="text-sm font-semibold text-app-muted">Shared goal</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-app-text">
              {topGoal ? `${topGoal.percent}% funded` : "Start with one goal"}
            </p>
            <p className="mt-1 text-sm text-app-muted">
              {topGoal ? `${topGoal.name} has ${formatCurrency(topGoal.saved)} saved.` : "A shared goal makes the plan feel real."}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-app-text">Recent activity</h2>
          <Link href="/transactions" className="text-sm font-semibold text-app-tint">See all</Link>
        </div>
        <div className="grid gap-3">
          {data.transactions.slice(0, 4).map((transaction) => (
            <Link href={`/transactions/${transaction.id}/edit`} key={transaction.id} className="ios-card flex min-h-[72px] items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold text-app-text">{categoryEmoji(transaction.categories?.name)} {transaction.description}</p>
                <p className="mt-1 text-sm text-app-muted">{formatShortDate(transaction.occurred_on)}</p>
                <p className="text-sm text-app-muted">{transaction.categories?.name ?? "Uncategorized"}</p>
              </div>
              <p className={transaction.kind === "income" ? "font-bold text-app-success" : "font-bold text-app-text"}>
                {transaction.kind === "income" ? "+" : "-"}{formatCurrency(Number(transaction.amount))}
              </p>
            </Link>
          ))}
          {data.transactions.length === 0 ? (
            <Link href="/transactions/new" className="ios-card block p-5 text-center font-semibold text-app-tint">
              Add your first transaction
            </Link>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
