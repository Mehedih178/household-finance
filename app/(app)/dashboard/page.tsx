import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CashFlowChart } from "@/components/charts";
import { ProgressBar } from "@/components/progress-bar";
import { StatCard } from "@/components/stat-card";
import { budgetAlert, daysLeftInMonth } from "@/lib/budgeting";
import { getDashboardData } from "@/lib/data";
import { formatCurrency, monthKey } from "@/lib/utils";

export default async function DashboardPage() {
  const currentMonth = monthKey();
  const data = await getDashboardData(currentMonth);
  const income = data.transactions.filter((t) => t.kind === "income").reduce((sum, t) => sum + Number(t.amount), 0);
  const expenses = data.transactions.filter((t) => t.kind === "expense").reduce((sum, t) => sum + Number(t.amount), 0);
  const balance = income - expenses;
  const daysLeft = daysLeftInMonth(currentMonth);

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
        <Link href="/transactions/new" className="ios-button h-11 min-h-11 rounded-full px-4">
          <Plus size={20} />
        </Link>
      }
    >
      <section className="rounded-[30px] bg-app-tint p-5 text-white shadow-ios">
        <p className="text-sm font-semibold opacity-80">Household cash flow</p>
        <p className="mt-2 text-4xl font-bold tracking-tight">{formatCurrency(balance)}</p>
        <p className="mt-2 text-sm opacity-85">{data.householdName} this month</p>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3">
        <StatCard label="Income" value={income} tone="good" />
        <StatCard label="Spent" value={expenses} tone="bad" />
      </section>

      <section className="ios-card mt-5 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold text-app-text">Cash flow</h2>
          <span className="text-sm text-app-muted">Month</span>
        </div>
        <CashFlowChart data={chartData} />
      </section>

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-app-text">Budgets</h2>
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

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-app-text">Recent</h2>
          <Link href="/transactions" className="text-sm font-semibold text-app-tint">See all</Link>
        </div>
        <div className="grid gap-3">
          {data.transactions.slice(0, 5).map((transaction) => (
            <Link href={`/transactions/${transaction.id}/edit`} key={transaction.id} className="ios-card flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-app-text">{transaction.description}</p>
                <p className="text-sm text-app-muted">{transaction.categories?.name ?? "Uncategorized"} · {transaction.is_shared ? "Shared" : "Personal"}</p>
              </div>
              <p className={transaction.kind === "income" ? "font-bold text-app-success" : "font-bold text-app-text"}>
                {transaction.kind === "income" ? "+" : "-"}{formatCurrency(Number(transaction.amount))}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
