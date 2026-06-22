import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CashFlowChart } from "@/components/charts";
import { ProgressBar } from "@/components/progress-bar";
import { StatCard } from "@/components/stat-card";
import { getDashboardData } from "@/lib/data";
import { formatCurrency, monthKey } from "@/lib/utils";

export default async function DashboardPage() {
  const data = await getDashboardData(monthKey());
  const income = data.transactions.filter((t) => t.kind === "income").reduce((sum, t) => sum + Number(t.amount), 0);
  const expenses = data.transactions.filter((t) => t.kind === "expense").reduce((sum, t) => sum + Number(t.amount), 0);
  const balance = income - expenses;

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
            const percent = Number(budget.amount) ? (spent / Number(budget.amount)) * 100 : 0;
            return (
              <div key={budget.id} className="ios-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold text-app-text">{budget.categories?.name ?? "Budget"}</p>
                  <p className="text-sm text-app-muted">{formatCurrency(spent)} / {formatCurrency(Number(budget.amount))}</p>
                </div>
                <ProgressBar value={percent} />
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
