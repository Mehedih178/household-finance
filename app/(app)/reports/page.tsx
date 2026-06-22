import { AppShell } from "@/components/app-shell";
import { CashFlowChart, SpendingChart } from "@/components/charts";
import { ProgressRing } from "@/components/progress-ring";
import { monthRange, previousMonthKey } from "@/lib/budgeting";
import { requireHousehold } from "@/lib/data";
import { compareCategoryTrends, financialHealthScore, moneyBreakdown, totals } from "@/lib/insights";
import { formatCurrency, monthKey } from "@/lib/utils";

export default async function ReportsPage() {
  const { supabase, householdId } = await requireHousehold();
  const month = monthKey();
  const currentMonth = monthRange(month);
  const lastMonth = monthRange(previousMonthKey(month));
  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;

  const [
    { data: transactions },
    { data: previousMonthTransactions },
    { data: currentYearTransactions },
    { data: previousYearTransactions },
    { data: budgets }
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select("*, categories(name, color)")
      .eq("household_id", householdId)
      .gte("occurred_on", currentMonth.start)
      .lt("occurred_on", currentMonth.end)
      .order("occurred_on", { ascending: true }),
    supabase
      .from("transactions")
      .select("*, categories(name, color)")
      .eq("household_id", householdId)
      .gte("occurred_on", lastMonth.start)
      .lt("occurred_on", lastMonth.end),
    supabase
      .from("transactions")
      .select("*, categories(name, color)")
      .eq("household_id", householdId)
      .gte("occurred_on", `${currentYear}-01-01`)
      .lt("occurred_on", `${currentYear + 1}-01-01`),
    supabase
      .from("transactions")
      .select("*, categories(name, color)")
      .eq("household_id", householdId)
      .gte("occurred_on", `${lastYear}-01-01`)
      .lt("occurred_on", `${currentYear}-01-01`),
    supabase
      .from("budgets")
      .select("*")
      .eq("household_id", householdId)
      .eq("month", currentMonth.start)
  ]);

  const currentTransactions = transactions ?? [];
  const priorMonthTransactions = previousMonthTransactions ?? [];
  const spendingByCategory = moneyBreakdown(currentTransactions).slice(0, 6);
  const monthlyTrends = compareCategoryTrends(currentTransactions, priorMonthTransactions);
  const yearlyTrends = compareCategoryTrends(currentYearTransactions ?? [], previousYearTransactions ?? []);
  const health = financialHealthScore({
    currentBudgets: budgets ?? [],
    currentTransactions,
    previousTransactions: priorMonthTransactions
  });

  const cashFlow = Array.from({ length: 4 }).map((_, index) => {
    const week = index + 1;
    const weekly = currentTransactions.filter((transaction) => Math.ceil(Number(transaction.occurred_on.slice(8, 10)) / 7) === week);
    return {
      label: `W${week}`,
      income: weekly.filter((transaction) => transaction.kind === "income").reduce((sum, transaction) => sum + Number(transaction.amount), 0),
      expense: weekly.filter((transaction) => transaction.kind === "expense").reduce((sum, transaction) => sum + Number(transaction.amount), 0)
    };
  });

  const currentTotals = totals(currentTransactions);

  return (
    <AppShell title="Reports">
      <section className="ios-card p-5">
        <div className="flex items-center gap-5">
          <ProgressRing color="#34c759" label="Financial health score" value={health.score} />
          <div>
            <p className="text-sm font-semibold text-app-muted">Financial health score</p>
            <p className="mt-1 text-4xl font-bold tracking-tight text-app-text">{health.score}/100</p>
            <p className="mt-1 text-sm text-app-muted">Savings, budgets, debt, and emergency fund growth.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-2">
          {health.parts.map((part) => (
            <div key={part.label} className="flex items-center justify-between rounded-2xl bg-app-bg px-3 py-2 text-sm">
              <span className="font-medium text-app-text">{part.label}</span>
              <span className="font-bold text-app-tint">{Math.round(part.score)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3">
        <div className="ios-card p-4">
          <p className="text-sm text-app-muted">Income</p>
          <p className="mt-1 text-2xl font-bold text-app-success">{formatCurrency(currentTotals.income)}</p>
        </div>
        <div className="ios-card p-4">
          <p className="text-sm text-app-muted">Expenses</p>
          <p className="mt-1 text-2xl font-bold text-app-danger">{formatCurrency(currentTotals.expenses)}</p>
        </div>
      </section>

      <section className="ios-card mt-5 p-4">
        <h2 className="text-lg font-bold text-app-text">Monthly cash flow</h2>
        <CashFlowChart data={cashFlow} />
      </section>

      <section className="ios-card mt-5 p-4">
        <h2 className="text-lg font-bold text-app-text">Where did my money go?</h2>
        <div className="mt-4 grid gap-3">
          {spendingByCategory.map((category) => (
            <div key={category.name}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-app-text">{category.name}</span>
                <span className="text-app-muted">{category.percent}% · {formatCurrency(category.amount)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-app-line">
                <div className="h-full rounded-full bg-app-tint" style={{ width: `${category.percent}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="ios-card mt-5 p-4">
        <h2 className="text-lg font-bold text-app-text">Spending trends</h2>
        <div className="mt-4 grid gap-4">
          <TrendList title="This month vs last month" items={monthlyTrends} />
          <TrendList title="This year vs last year" items={yearlyTrends.slice(0, 5)} />
        </div>
      </section>

      <section className="ios-card mt-5 p-4">
        <h2 className="text-lg font-bold text-app-text">Top spending chart</h2>
        {spendingByCategory.length > 0 ? (
          <SpendingChart data={spendingByCategory} />
        ) : (
          <div className="py-10 text-center">
            <p className="font-semibold text-app-text">No spending data yet</p>
            <p className="mt-1 text-sm text-app-muted">Expense transactions will appear here.</p>
          </div>
        )}
      </section>
    </AppShell>
  );
}

function TrendList({
  items,
  title
}: {
  items: Array<{ amount: number; change: number; name: string }>;
  title: string;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-app-muted">{title}</p>
      <div className="grid gap-2">
        {items.length > 0 ? items.map((item) => {
          const improving = item.change <= 0;
          const arrow = item.change > 0 ? "up" : "down";
          return (
            <div key={`${title}-${item.name}`} className="flex items-center justify-between rounded-2xl bg-app-bg px-3 py-2">
              <span className="font-medium text-app-text">{item.name}</span>
              <span className={improving ? "font-bold text-app-success" : "font-bold text-app-danger"}>
                {arrow === "up" ? "↑" : "↓"} {Math.abs(item.change)}%
              </span>
            </div>
          );
        }) : (
          <p className="rounded-2xl bg-app-bg px-3 py-2 text-sm text-app-muted">Not enough history yet.</p>
        )}
      </div>
    </div>
  );
}
