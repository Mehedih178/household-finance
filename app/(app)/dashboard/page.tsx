import Link from "next/link";
import { Bell, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CashFlowChart } from "@/components/charts";
import { InstallPromptCard } from "@/components/install-prompt-card";
import { HouseholdSiteSwitcher } from "@/components/household-site-switcher";
import { ProgressBar } from "@/components/progress-bar";
import { StatCard } from "@/components/stat-card";
import { budgetAlert, daysLeftInMonth } from "@/lib/budgeting";
import { getDashboardData } from "@/lib/data";
import { defaultNotificationPreferences, generateFinanceInbox } from "@/lib/finance-inbox";
import { completedGoals, savingsStreak, savingsTotal, underBudgetStreak } from "@/lib/gamification";
import { categoryEmoji, formatCurrency, formatShortDate, monthKey } from "@/lib/utils";

export default async function DashboardPage() {
  const currentMonth = monthKey();
  const data = await getDashboardData(currentMonth);
  const income = data.transactions.filter((t) => t.kind === "income").reduce((sum, t) => sum + Number(t.amount), 0);
  const expenses = data.transactions.filter((t) => t.kind === "expense").reduce((sum, t) => sum + Number(t.amount), 0);
  const daysLeft = daysLeftInMonth(currentMonth);
  const budgetStreak = underBudgetStreak({
    budgets: data.streakBudgets,
    month: currentMonth,
    transactions: data.streakTransactions
  });
  const monthlySavingsStreak = savingsStreak({
    month: currentMonth,
    transactions: data.streakTransactions
  });
  const savings = savingsTotal(data.transactions);
  const completed = completedGoals(data.goals, data.goalContributions);
  const inbox = generateFinanceInbox({
    accounts: data.accounts,
    budgets: data.budgets,
    contributions: data.goalContributions,
    currentMonthTransactions: data.transactions,
    goals: data.goals,
    previousMonthTransactions: data.previousTransactions,
    preferences: data.notificationPreferences ?? defaultNotificationPreferences,
    recurring: data.recurring,
    snapshots: data.snapshots,
    userId: data.user.id
  });
  const readIds = new Set(data.notificationReads.map((item) => item.notification_id));
  const unreadInboxCount = inbox.items.filter((item) => !readIds.has(item.id)).length;
  const totalBudgeted = data.budgets.reduce((sum, budget) => sum + Number(budget.amount), 0);
  const remainingBudget = totalBudgeted - expenses;
  const budgetUsedPercent = totalBudgeted > 0 ? Math.min(100, Math.max(0, (expenses / totalBudgeted) * 100)) : 0;
  const status = remainingBudget >= 0 ? "You're on track this month" : "You're over plan this month";
  const nextBills = data.recurring.slice(0, 3);
  const nextBill = nextBills[0];
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
    .sort((first, second) => first.percent - second.percent)[0];
  const goalLine = topGoal
    ? topGoal.percent < 50
      ? `${topGoal.name} goal needs attention.`
      : `${topGoal.name} is ${topGoal.percent}% funded.`
    : "Create a shared goal together.";
  const chartData = Array.from({ length: 4 }).map((_, index) => {
    const week = index + 1;
    const weekly = data.transactions.filter((t) => {
      const day = Number(t.occurred_on.slice(8, 10));
      return Math.ceil(day / 7) === week;
    });
    return {
      label: `W${week}`,
      income: weekly.filter((t) => t.kind === "income").reduce((sum, t) => sum + Number(t.amount), 0),
      expense: weekly.filter((t) => t.kind === "expense").reduce((sum, t) => sum + Number(t.amount), 0)
    };
  });

  return (
    <AppShell
      title="Today"
      action={
        <div className="flex gap-2">
          <Link href="/notifications" className="ios-secondary-button relative h-11 min-h-11 rounded-full px-4" aria-label="Finance inbox">
            <Bell size={19} />
            {unreadInboxCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-app-danger px-1 text-[11px] font-bold text-white">
                {Math.min(9, unreadInboxCount)}
              </span>
            ) : null}
          </Link>
          <Link href="/transactions/new" className="ios-button h-11 min-h-11 rounded-full px-4">
            <Plus size={20} />
          </Link>
        </div>
      }
    >
      <HouseholdSiteSwitcher activeHouseholdId={data.householdId} memberships={data.memberships} />

      <section className="ios-card p-5">
        <p className="text-lg font-medium text-app-muted">Good afternoon</p>
        <p className="mt-2 text-3xl font-extrabold tracking-tight text-app-text">{status.replace("You're", "Your household is")}</p>
        <div className="mt-5 rounded-ios bg-app-tint p-4 text-white shadow-ios-sm">
          <p className="text-sm font-semibold opacity-85">Available this month</p>
          <p className="mt-2 text-4xl font-extrabold tracking-tight">{formatCurrency(remainingBudget)}</p>
          <p className="mt-1 text-sm opacity-85">
            {spendingDelta === null
              ? "Add more history to compare with last month."
              : `${Math.abs(spendingDelta)}% ${spendingDelta > 0 ? "more" : "less"} spending than last month.`}
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${budgetUsedPercent}%` }} />
          </div>
        </div>
        <div className="mt-4 grid gap-3 text-sm">
          <div className="flex items-center justify-between rounded-2xl bg-app-bg px-3 py-2">
            <span className="text-app-muted">Coming up</span>
            <span className="font-semibold text-app-text">
              {nextBill ? `${nextBill.description} ${formatShortDate(nextBill.next_due_on)}` : "No bills due soon"}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-app-bg px-3 py-2">
            <span className="text-app-muted">Goal</span>
            <span className="text-right font-semibold text-app-text">{goalLine}</span>
          </div>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3">
        <StatCard label="Income" value={income} tone="good" />
        <StatCard label="Spent" value={expenses} tone="bad" />
      </section>

      <Link href="/notifications" className="ios-card mt-5 block p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-app-muted">Daily brief</p>
            <p className="mt-1 text-xl font-bold text-app-text">
              {unreadInboxCount > 0 ? `${unreadInboxCount} item${unreadInboxCount === 1 ? "" : "s"} need attention` : "Everything looks calm"}
            </p>
          </div>
          <span className="rounded-full bg-app-tint/10 px-3 py-1 text-sm font-bold text-app-tint">Updates</span>
        </div>
        <p className="mt-3 rounded-2xl bg-app-bg p-3 text-sm font-medium text-app-text">{inbox.brief.tip}</p>
      </Link>

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-app-text">Upcoming bills</h2>
          <Link href="/recurring" className="text-sm font-semibold text-app-tint">Manage</Link>
        </div>
        <div className="grid gap-3">
          {nextBills.length > 0 ? nextBills.map((item) => (
            <Link key={item.id} href="/recurring" className="ios-card flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-app-text">{item.description}</p>
                <p className="mt-1 text-sm text-app-muted">{formatShortDate(item.next_due_on)} · {item.frequency}</p>
              </div>
              <p className="font-bold text-app-text">{formatCurrency(Number(item.amount))}</p>
            </Link>
          )) : (
            <Link href="/recurring" className="ios-card block p-4 text-center font-semibold text-app-tint">Add recurring bills</Link>
          )}
        </div>
      </section>

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-app-text">Recent activity</h2>
          <Link href="/transactions" className="text-sm font-semibold text-app-tint">See all</Link>
        </div>
        <div className="grid gap-3">
          {data.transactions.slice(0, 4).map((transaction) => (
            <Link href={`/transactions/${transaction.id}/edit`} key={transaction.id} className="ios-card flex min-h-[64px] items-center justify-between p-4">
              <div>
                <p className="font-semibold text-app-text">{categoryEmoji(transaction.categories?.name)} {transaction.description}</p>
                <p className="text-sm text-app-muted">{transaction.categories?.name ?? "Uncategorized"} · {formatShortDate(transaction.occurred_on)}</p>
              </div>
              <p className={transaction.kind === "income" ? "font-bold text-app-success" : "font-bold text-app-text"}>
                {transaction.kind === "income" ? "+" : "-"}{formatCurrency(Number(transaction.amount))}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-app-text">Wins</h2>
          <Link href="/goals" className="text-sm font-semibold text-app-tint">Goals</Link>
        </div>
        <div className="grid gap-3">
          <div className="ios-card p-4">
            <p className="text-sm font-semibold text-app-muted">Savings streak</p>
            <p className="mt-2 text-xl font-bold text-app-text">
              {budgetStreak > 0 ? `Under budget ${budgetStreak} month${budgetStreak === 1 ? "" : "s"} in a row` : "Keep going this month"}
            </p>
            <p className="mt-1 text-sm text-app-muted">
              {budgetStreak >= 4 ? "Achievement unlocked: under budget 4 months in a row." : "Stay inside your envelopes to build a streak."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="ios-card p-4">
              <p className="text-sm text-app-muted">First $1,000 saved</p>
              <p className={savings >= 1000 ? "mt-2 font-bold text-app-success" : "mt-2 font-bold text-app-text"}>
                {savings >= 1000 ? "Unlocked" : `${formatCurrency(Math.max(0, 1000 - savings))} left`}
              </p>
            </div>
            <div className="ios-card p-4">
              <p className="text-sm text-app-muted">6-month savings streak</p>
              <p className={monthlySavingsStreak >= 6 ? "mt-2 font-bold text-app-success" : "mt-2 font-bold text-app-text"}>
                {monthlySavingsStreak >= 6 ? "Unlocked" : `${monthlySavingsStreak}/6`}
              </p>
            </div>
          </div>
          {completed.length > 0 ? (
            <div className="ios-card p-4">
              <p className="text-sm text-app-muted">Completed goals</p>
              <p className="mt-2 font-bold text-app-success">
                {completed.map((goal) => `${goal.name} completed`).join(", ")}
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-app-text">Monthly plan</h2>
          <Link href="/budgets" className="text-sm font-semibold text-app-tint">Manage</Link>
        </div>
        <div className="grid gap-3">
          {data.budgets.slice(0, 3).map((budget) => {
            const spent = data.transactions
              .filter((t) => t.kind === "expense" && t.category_id === budget.category_id)
              .reduce((sum, t) => sum + Number(t.amount), 0);
            const previousBudget = data.previousBudgets.find((item) => item.category_id === budget.category_id);
            const previousSpent = data.previousTransactions
              .filter((t) => t.category_id === budget.category_id)
              .reduce((sum, t) => sum + Number(t.amount), 0);
            const rollover = previousBudget ? Math.max(0, Number(previousBudget.amount) - previousSpent) : 0;
            const envelopeTotal = Number(budget.amount) + rollover;
            const percent = envelopeTotal ? (spent / envelopeTotal) * 100 : 0;
            const categoryName = budget.categories?.name ?? "Budget";
            const alert = budgetAlert({
              budgetAmount: envelopeTotal,
              categoryName,
              daysLeft,
              spent
            });
            return (
              <div key={budget.id} className="ios-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold text-app-text">{categoryName}</p>
                  <p className="text-sm text-app-muted">{formatCurrency(spent)} / {formatCurrency(envelopeTotal)}</p>
                </div>
                <ProgressBar value={percent} />
                {rollover > 0 ? (
                  <p className="mt-2 text-xs text-app-muted">{formatCurrency(rollover)} rolled over from last month</p>
                ) : null}
                {alert ? (
                  <p className="mt-2 text-sm font-medium text-app-danger">{alert}</p>
                ) : null}
              </div>
            );
          })}
          {data.budgets.length === 0 ? (
            <Link href="/budgets" className="ios-card block p-4 text-center font-semibold text-app-tint">
              Add your first monthly budget
            </Link>
          ) : null}
        </div>
      </section>

      <section className="ios-card mt-5 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold text-app-text">This month</h2>
          <Link href="/reports" className="text-sm font-semibold text-app-tint">Reports</Link>
        </div>
        <CashFlowChart data={chartData} />
      </section>

      <InstallPromptCard />
    </AppShell>
  );
}
