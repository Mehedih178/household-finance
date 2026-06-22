import { AppShell } from "@/components/app-shell";
import { CashFlowChart, SpendingChart } from "@/components/charts";
import { requireHousehold } from "@/lib/data";
import { formatCurrency, monthKey } from "@/lib/utils";

export default async function ReportsPage() {
  const { supabase, householdId } = await requireHousehold();
  const month = monthKey();
  const monthStart = `${month}-01`;
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*, categories(name, color)")
    .eq("household_id", householdId)
    .gte("occurred_on", monthStart)
    .order("occurred_on", { ascending: true });

  const spendingByCategory = Object.values(
    (transactions ?? []).filter((transaction) => transaction.kind === "expense").reduce<Record<string, { name: string; amount: number }>>((acc, transaction) => {
      const name = transaction.categories?.name ?? "Other";
      acc[name] = acc[name] ?? { name, amount: 0 };
      acc[name].amount += Number(transaction.amount);
      return acc;
    }, {})
  ).sort((a, b) => b.amount - a.amount).slice(0, 6);

  const cashFlow = Array.from({ length: 4 }).map((_, index) => {
    const week = index + 1;
    const weekly = (transactions ?? []).filter((transaction) => Math.ceil(Number(transaction.occurred_on.slice(8, 10)) / 7) === week);
    return {
      label: `W${week}`,
      income: weekly.filter((transaction) => transaction.kind === "income").reduce((sum, transaction) => sum + Number(transaction.amount), 0),
      expense: weekly.filter((transaction) => transaction.kind === "expense").reduce((sum, transaction) => sum + Number(transaction.amount), 0)
    };
  });

  const income = cashFlow.reduce((sum, item) => sum + item.income, 0);
  const expense = cashFlow.reduce((sum, item) => sum + item.expense, 0);

  return (
    <AppShell title="Reports">
      <section className="grid grid-cols-2 gap-3">
        <div className="ios-card p-4">
          <p className="text-sm text-app-muted">Income</p>
          <p className="mt-1 text-2xl font-bold text-app-success">{formatCurrency(income)}</p>
        </div>
        <div className="ios-card p-4">
          <p className="text-sm text-app-muted">Expenses</p>
          <p className="mt-1 text-2xl font-bold text-app-danger">{formatCurrency(expense)}</p>
        </div>
      </section>

      <section className="ios-card mt-5 p-4">
        <h2 className="text-lg font-bold text-app-text">Monthly cash flow</h2>
        <CashFlowChart data={cashFlow} />
      </section>

      <section className="ios-card mt-5 p-4">
        <h2 className="text-lg font-bold text-app-text">Top spending</h2>
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
